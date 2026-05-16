-- =====================================================================
-- ChillGo Security & Consistency Fixes
-- Run this migration AFTER all previous migrations.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. notifications: add INSERT policy (was missing — all client inserts failed silently)
-- Policy: any authenticated user can create a notification for any user
-- (this is intentional: customer creates booking → notif for partner + admins;
--  partner ends job → notif for customer; ReviewModal notif for partner; etc.)
-- ---------------------------------------------------------------------
drop policy if exists "Authenticated users can create notifications" on notifications;
create policy "Authenticated users can create notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- 2. Realtime publication: make notifications add idempotent
-- (migration_reviews.sql tried to re-add it; this fixes runs going forward)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 3. Drop stale enum value 'car_rental' from partner_category
-- Postgres has no DROP VALUE; we rename the type and recreate it.
-- Maps any existing 'car_rental' row to 'driver'.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'partner_category' and e.enumlabel = 'car_rental'
  ) then
    alter type partner_category rename to partner_category_old;
    create type partner_category as enum ('guide', 'driver', 'translator');

    alter table partner_profiles
      alter column category type partner_category
      using (case when category::text = 'car_rental' then 'driver'::partner_category
                  else category::text::partner_category end);

    alter table posts
      alter column category type partner_category
      using (case when category::text = 'car_rental' then 'driver'::partner_category
                  else category::text::partner_category end);

    drop type partner_category_old;
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 4. Stripe webhook idempotency — dedupe by event id
-- Only the webhook (service role) writes/reads this; no policies = locked
-- to anon/authenticated which is exactly what we want.
-- ---------------------------------------------------------------------
create table if not exists stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now()
);
alter table stripe_events enable row level security;

-- ---------------------------------------------------------------------
-- 5. Reviews: UPDATE and DELETE policies (defensive — no UI uses them today)
-- ---------------------------------------------------------------------
drop policy if exists "Customers can update own reviews" on reviews;
create policy "Customers can update own reviews"
  on reviews for update using (auth.uid() = customer_id);

drop policy if exists "Customers can delete own reviews" on reviews;
create policy "Customers can delete own reviews"
  on reviews for delete using (auth.uid() = customer_id);

-- ---------------------------------------------------------------------
-- 6. Auto-recompute partner_profiles.rating via DB trigger
-- (closes the last-write-wins race in ReviewModal client code)
-- ---------------------------------------------------------------------
create or replace function refresh_partner_rating(target_partner_user_id uuid)
returns void as $$
declare
  v_partner_profile_id uuid;
  v_avg numeric;
  v_count int;
begin
  -- find partner_profile.id from the post linked to this review's booking
  -- Simpler approach: aggregate across all reviews keyed on partner profile (user_id)
  select id into v_partner_profile_id
  from partner_profiles
  where user_id = target_partner_user_id
  order by created_at desc
  limit 1;

  if v_partner_profile_id is null then
    return;
  end if;

  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    into v_avg, v_count
    from reviews
   where partner_id = target_partner_user_id;

  update partner_profiles
     set rating = v_avg, total_reviews = v_count
   where user_id = target_partner_user_id;
end;
$$ language plpgsql security definer;

create or replace function trg_review_refresh_rating()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    perform refresh_partner_rating(old.partner_id);
    return old;
  else
    perform refresh_partner_rating(new.partner_id);
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists reviews_refresh_rating on reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function trg_review_refresh_rating();

-- ---------------------------------------------------------------------
-- 7. Bookings: enforce that customer cannot transition status to 'paid'
-- directly (only webhook with service role can). This closes the
-- "customer marks own booking paid" attack from the pay page.
-- ---------------------------------------------------------------------
create or replace function enforce_booking_status_transition()
returns trigger as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- service role + admin bypass (auth.uid() is null when using service role)
  if auth.uid() is null then return new; end if;

  if exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;

  -- customer transitions allowed
  if auth.uid() = old.customer_id then
    if new.status = 'cancelled' and old.status in ('pending', 'approved', 'confirmed', 'alternative_offered') then
      return new;
    end if;
    raise exception 'Customers cannot transition booking from % to %', old.status, new.status;
  end if;

  -- partner transitions allowed
  if auth.uid() = old.partner_id then
    if new.status = 'in_progress' and old.status = 'paid' then return new; end if;
    if new.status = 'completed' and old.status = 'in_progress' then return new; end if;
    raise exception 'Partners cannot transition booking from % to %', old.status, new.status;
  end if;

  raise exception 'User % cannot modify booking %', auth.uid(), old.id;
end;
$$ language plpgsql security definer;

drop trigger if exists bookings_status_transition_check on bookings;
create trigger bookings_status_transition_check
  before update of status on bookings
  for each row execute function enforce_booking_status_transition();

-- ---------------------------------------------------------------------
-- 8. Bookings: prevent customer from swapping post_id (alternative_offered abuse)
-- Only admin / service role can change post_id.
-- ---------------------------------------------------------------------
create or replace function enforce_booking_post_id()
returns trigger as $$
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  if auth.uid() is null then return new; end if;
  if exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;
  -- allow customer to switch ONLY to the alternative_post_id (accept-alternative flow)
  if auth.uid() = old.customer_id and new.post_id = old.alternative_post_id then
    return new;
  end if;
  raise exception 'Only admin can change booking post_id';
end;
$$ language plpgsql security definer;

drop trigger if exists bookings_post_id_check on bookings;
create trigger bookings_post_id_check
  before update of post_id on bookings
  for each row execute function enforce_booking_post_id();

-- ---------------------------------------------------------------------
-- 9. Bookings: prevent customer from manipulating total_price
-- ---------------------------------------------------------------------
create or replace function enforce_booking_total_price()
returns trigger as $$
begin
  if new.total_price is not distinct from old.total_price then return new; end if;
  if auth.uid() is null then return new; end if;
  if exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;
  raise exception 'Only admin can change booking total_price';
end;
$$ language plpgsql security definer;

drop trigger if exists bookings_total_price_check on bookings;
create trigger bookings_total_price_check
  before update of total_price on bookings
  for each row execute function enforce_booking_total_price();

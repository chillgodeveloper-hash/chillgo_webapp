-- ---------------------------------------------------------------------
-- Remove the 'translator' partner category entirely (data + enum value).
-- ChillGo now offers only Tour Guide and Driver.
--
-- Safe to run multiple times. Deletes dependent rows in FK order before
-- dropping the enum value (Postgres has no DROP VALUE, so we recreate it).
-- ---------------------------------------------------------------------

-- 1. Delete bookings tied to translator posts (cascades chat_messages,
--    receipts, reviews, booking_locations, and work_history-by-booking).
delete from bookings
where post_id in (select id from posts where category = 'translator')
   or alternative_post_id in (select id from posts where category = 'translator');

-- 2. Remove any leftover work_history rows that point at translator posts
--    (work_history.post_id has no ON DELETE CASCADE). The table is optional
--    (from migration_work_history.sql) — skip if it hasn't been created.
do $$
begin
  if to_regclass('public.work_history') is not null then
    delete from work_history
    where post_id in (select id from posts where category = 'translator');
  end if;
end$$;

-- 3. Delete translator posts and partner profiles.
delete from posts where category = 'translator';
delete from partner_profiles where category = 'translator';

-- 4. Drop the 'translator' value from the enum by recreating the type.
do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'partner_category' and e.enumlabel = 'translator'
  ) then
    alter type partner_category rename to partner_category_old;
    create type partner_category as enum ('guide', 'driver');

    alter table partner_profiles
      alter column category type partner_category
      using (category::text::partner_category);

    alter table posts
      alter column category type partner_category
      using (category::text::partner_category);

    drop type partner_category_old;
  end if;
end$$;

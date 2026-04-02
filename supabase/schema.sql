create extension if not exists "uuid-ossp";

create type user_role as enum ('admin', 'partner', 'customer');
create type partner_category as enum ('guide', 'car_rental');
create type booking_status as enum (
  'pending', 'approved', 'alternative_offered',
  'confirmed', 'paid', 'in_progress', 'completed', 'cancelled'
);
create type post_status as enum ('active', 'flagged', 'removed');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  role user_role,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table partner_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  category partner_category not null,
  business_name text not null,
  description text default '',
  portfolio_images text[] default '{}',
  is_verified boolean default false,
  rating numeric(2,1) default 0,
  total_reviews int default 0,
  created_at timestamptz default now()
);

create table posts (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references partner_profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  media_urls text[] default '{}',
  media_types text[] default '{}',
  category partner_category not null,
  price_min numeric,
  price_max numeric,
  location text,
  status post_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table bookings (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references profiles(id) not null,
  partner_id uuid references profiles(id) not null,
  post_id uuid references posts(id) not null,
  booking_date date not null,
  booking_end_date date,
  guests int default 1,
  note text,
  status booking_status default 'pending',
  total_price numeric,
  stripe_payment_intent_id text,
  admin_note text,
  alternative_post_id uuid references posts(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_messages (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  message text not null,
  media_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'system',
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

create index idx_posts_partner on posts(partner_id);
create index idx_posts_category on posts(category);
create index idx_posts_status on posts(status);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_partner on bookings(partner_id);
create index idx_bookings_status on bookings(status);
create index idx_chat_booking on chat_messages(booking_id);
create index idx_notifications_user on notifications(user_id);

alter table profiles enable row level security;
alter table partner_profiles enable row level security;
alter table posts enable row level security;
alter table bookings enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Partner profiles are viewable by everyone"
  on partner_profiles for select using (true);

create policy "Partners can insert own profile"
  on partner_profiles for insert with check (auth.uid() = user_id);

create policy "Partners can update own profile"
  on partner_profiles for update using (auth.uid() = user_id);

create policy "Active posts are viewable by everyone"
  on posts for select using (status = 'active' or exists(
    select 1 from partner_profiles where partner_profiles.id = posts.partner_id and partner_profiles.user_id = auth.uid()
  ));

create policy "Partners can insert posts"
  on posts for insert with check (exists(
    select 1 from partner_profiles where partner_profiles.id = partner_id and partner_profiles.user_id = auth.uid()
  ));

create policy "Partners can update own posts"
  on posts for update using (exists(
    select 1 from partner_profiles where partner_profiles.id = posts.partner_id and partner_profiles.user_id = auth.uid()
  ));

create policy "Partners can delete own posts"
  on posts for delete using (exists(
    select 1 from partner_profiles where partner_profiles.id = posts.partner_id and partner_profiles.user_id = auth.uid()
  ));

create policy "Users can view own bookings"
  on bookings for select using (
    auth.uid() = customer_id or
    auth.uid() = partner_id or
    exists(select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Customers can create bookings"
  on bookings for insert with check (auth.uid() = customer_id);

create policy "Booking updates by involved parties or admin"
  on bookings for update using (
    auth.uid() = customer_id or
    auth.uid() = partner_id or
    exists(select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Chat participants can view messages"
  on chat_messages for select using (exists(
    select 1 from bookings
    where bookings.id = chat_messages.booking_id
    and (bookings.customer_id = auth.uid() or bookings.partner_id = auth.uid()
    or exists(select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "Chat participants can send messages"
  on chat_messages for insert with check (
    auth.uid() = sender_id and exists(
      select 1 from bookings
      where bookings.id = booking_id
      and (bookings.customer_id = auth.uid() or bookings.partner_id = auth.uid())
    )
  );

create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    null
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on profiles for each row execute function update_updated_at();
create trigger set_updated_at_posts before update on posts for each row execute function update_updated_at();
create trigger set_updated_at_bookings before update on bookings for each row execute function update_updated_at();

alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table notifications;

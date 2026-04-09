create table booking_locations (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  created_at timestamptz default now()
);

create index idx_booking_locations_booking on booking_locations(booking_id);
create index idx_booking_locations_created on booking_locations(booking_id, created_at desc);

alter table booking_locations enable row level security;

create policy "Booking participants can view locations"
  on booking_locations for select using (
    exists(
      select 1 from bookings
      where bookings.id = booking_locations.booking_id
      and (bookings.customer_id = auth.uid() or bookings.partner_id = auth.uid()
      or exists(select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Users can insert own locations"
  on booking_locations for insert with check (auth.uid() = user_id);

alter publication supabase_realtime add table booking_locations;

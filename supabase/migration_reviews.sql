create table reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  customer_id uuid references profiles(id) not null,
  partner_id uuid references profiles(id) not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

create unique index idx_reviews_booking on reviews(booking_id);
create index idx_reviews_partner on reviews(partner_id);

alter table reviews enable row level security;

create policy "Anyone can read reviews"
  on reviews for select using (true);

create policy "Customers can create reviews for their bookings"
  on reviews for insert with check (
    auth.uid() = customer_id and
    exists (select 1 from bookings where bookings.id = booking_id and bookings.customer_id = auth.uid() and bookings.status in ('paid', 'completed'))
  );

alter publication supabase_realtime add table notifications;

create table work_history (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references profiles(id) not null,
  booking_id uuid references bookings(id) on delete cascade not null,
  post_id uuid references posts(id) not null,
  customer_id uuid references profiles(id) not null,
  status text default 'in_progress',
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_work_history_partner on work_history(partner_id);
create unique index idx_work_history_booking on work_history(booking_id);

alter table work_history enable row level security;

create policy "Anyone can read work history"
  on work_history for select using (true);

create policy "Partners can insert work history"
  on work_history for insert with check (auth.uid() = partner_id);

create policy "Partners can update own work history"
  on work_history for update using (auth.uid() = partner_id);

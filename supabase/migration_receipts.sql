create table receipts (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  receipt_number text not null unique,
  customer_id uuid references profiles(id) not null,
  partner_id uuid references profiles(id) not null,
  customer_name text not null,
  customer_email text not null,
  partner_name text not null,
  partner_email text not null,
  service_title text not null,
  booking_date date not null,
  booking_end_date date,
  guests int default 1,
  amount numeric not null,
  currency text default 'THB',
  payment_method text default 'card',
  stripe_payment_intent_id text,
  status text default 'paid',
  created_at timestamptz default now()
);

create index idx_receipts_booking on receipts(booking_id);
create index idx_receipts_customer on receipts(customer_id);
create index idx_receipts_partner on receipts(partner_id);
create index idx_receipts_number on receipts(receipt_number);

alter table receipts enable row level security;

create policy "Users can view own receipts" on receipts
  for select using (
    auth.uid() = customer_id
    or auth.uid() = partner_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

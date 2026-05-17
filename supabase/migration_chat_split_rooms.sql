-- Split chat into 1:1 rooms per booking.
-- Previously every chat_messages row shared the same booking-wide thread, so
-- when partner first opened "chat with customer" they saw the prior
-- admin↔customer history. Adding receiver_id ties each message to a specific
-- counterparty so rooms (booking_id, {sender, receiver}) are isolated.

-- 1. Add receiver_id (nullable for backfill)
alter table chat_messages add column if not exists receiver_id uuid references profiles(id);

-- 2. Backfill existing rows with best-effort counterparty:
--    customer sender → receiver=partner; partner sender → receiver=customer;
--    admin sender    → receiver=customer (most common support pattern).
update chat_messages cm
set receiver_id = case
  when cm.sender_id = b.customer_id then b.partner_id
  when cm.sender_id = b.partner_id then b.customer_id
  else b.customer_id
end
from bookings b
where b.id = cm.booking_id and cm.receiver_id is null;

-- 3. Enforce NOT NULL for new rows
alter table chat_messages alter column receiver_id set not null;

-- 4. Index for chat list "group-by counterparty" lookups
create index if not exists idx_chat_receiver on chat_messages(receiver_id);
create index if not exists idx_chat_booking_pair on chat_messages(booking_id, sender_id, receiver_id);

-- 5. Tighten SELECT RLS: only the two participants see a message (admins see all)
drop policy if exists "Chat participants can view messages" on chat_messages;
create policy "Chat participants can view messages"
  on chat_messages for select using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
    or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 6. INSERT RLS: sender must be authenticated; both sender and receiver must
--    be plausible parties of the booking (customer/partner) or an admin.
drop policy if exists "Chat participants can send messages" on chat_messages;
create policy "Chat participants can send messages"
  on chat_messages for insert with check (
    auth.uid() = sender_id
    and receiver_id is not null
    and sender_id <> receiver_id
    and (
      exists(
        select 1 from bookings b
        where b.id = booking_id
        and (b.customer_id = auth.uid() or b.partner_id = auth.uid())
      )
      or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
    )
    and (
      exists(
        select 1 from bookings b
        where b.id = booking_id
        and (b.customer_id = receiver_id or b.partner_id = receiver_id)
      )
      or exists(select 1 from profiles where id = receiver_id and role = 'admin')
    )
  );

-- 7. Auto-notify the receiver on new chat message.
create or replace function notify_chat_message()
returns trigger as $$
declare
  v_sender_name text;
begin
  select coalesce(full_name, 'ผู้ใช้') into v_sender_name from profiles where id = NEW.sender_id;

  insert into notifications (user_id, title, message, type, link)
  values (
    NEW.receiver_id,
    coalesce(v_sender_name, 'ข้อความใหม่'),
    NEW.message,
    'chat',
    '/chat/' || NEW.booking_id || '/' || NEW.sender_id
  );
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists chat_message_notification on chat_messages;
create trigger chat_message_notification
  after insert on chat_messages
  for each row execute function notify_chat_message();

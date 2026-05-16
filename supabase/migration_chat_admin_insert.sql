-- Allow admins to send chat messages in any booking
-- (previous policy only allowed customer_id or partner_id of the booking;
--  admins could SELECT but not INSERT, causing 403 from /chat list view)

drop policy if exists "Chat participants can send messages" on chat_messages;

create policy "Chat participants can send messages"
  on chat_messages for insert with check (
    auth.uid() = sender_id and (
      exists(
        select 1 from bookings
        where bookings.id = booking_id
        and (bookings.customer_id = auth.uid() or bookings.partner_id = auth.uid())
      )
      or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  );

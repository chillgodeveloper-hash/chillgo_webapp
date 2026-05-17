-- Restructure chat_messages SELECT policy so the admin role check is at the
-- top level (not nested inside the bookings subquery) — simpler, more reliable.

drop policy if exists "Chat participants can view messages" on chat_messages;

create policy "Chat participants can view messages"
  on chat_messages for select using (
    exists(
      select 1 from bookings
      where bookings.id = chat_messages.booking_id
      and (bookings.customer_id = auth.uid() or bookings.partner_id = auth.uid())
    )
    or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
  );

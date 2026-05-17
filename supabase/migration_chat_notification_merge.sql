-- Replace the chat notification trigger so it MERGES into an existing unread
-- notification for the same (receiver, sender, booking) conversation instead
-- of inserting a fresh row per message. A 200-message back-and-forth must
-- show as one bell entry, not 200.

create or replace function notify_chat_message()
returns trigger as $$
declare
  v_sender_name text;
  v_link text;
  v_existing_id uuid;
begin
  select coalesce(full_name, 'ผู้ใช้') into v_sender_name
  from profiles where id = NEW.sender_id;

  v_link := '/chat/' || NEW.booking_id || '/' || NEW.sender_id;

  -- Reuse the still-unread notification for this exact conversation, if any.
  select id into v_existing_id
  from notifications
  where user_id = NEW.receiver_id
    and type = 'chat'
    and link = v_link
    and is_read = false
  order by created_at desc
  limit 1;

  if v_existing_id is not null then
    update notifications
    set message = NEW.message,
        title = coalesce(v_sender_name, 'ข้อความใหม่'),
        created_at = now()
    where id = v_existing_id;
  else
    insert into notifications (user_id, title, message, type, link)
    values (
      NEW.receiver_id,
      coalesce(v_sender_name, 'ข้อความใหม่'),
      NEW.message,
      'chat',
      v_link
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

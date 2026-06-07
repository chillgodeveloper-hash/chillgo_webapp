-- ---------------------------------------------------------------------
-- Make deleting a user (from Supabase Auth) clean up all their data.
--
-- profiles.id already cascades from auth.users, but several tables
-- reference profiles(id) WITHOUT cascade, which blocks user deletion with
-- a foreign-key error once the user has bookings / chats / reviews / etc.
-- This migration converts those FKs to ON DELETE CASCADE.
--
-- Guarded with to_regclass so it works whether or not the optional tables
-- (receipts/reviews/work_history/booking_locations) have been created.
-- Idempotent: safe to run multiple times.
--
-- ⚠ NOTE: after this, deleting a user PERMANENTLY removes their bookings,
--    receipts, reviews, chats and work history too. Intended for cleanup.
-- ---------------------------------------------------------------------

do $$
begin
  -- bookings: customer / partner / post references
  if to_regclass('public.bookings') is not null then
    alter table bookings drop constraint if exists bookings_customer_id_fkey;
    alter table bookings add constraint bookings_customer_id_fkey
      foreign key (customer_id) references profiles(id) on delete cascade;

    alter table bookings drop constraint if exists bookings_partner_id_fkey;
    alter table bookings add constraint bookings_partner_id_fkey
      foreign key (partner_id) references profiles(id) on delete cascade;

    alter table bookings drop constraint if exists bookings_post_id_fkey;
    alter table bookings add constraint bookings_post_id_fkey
      foreign key (post_id) references posts(id) on delete cascade;

    alter table bookings drop constraint if exists bookings_alternative_post_id_fkey;
    alter table bookings add constraint bookings_alternative_post_id_fkey
      foreign key (alternative_post_id) references posts(id) on delete set null;
  end if;

  -- chat_messages: sender / receiver
  if to_regclass('public.chat_messages') is not null then
    alter table chat_messages drop constraint if exists chat_messages_sender_id_fkey;
    alter table chat_messages add constraint chat_messages_sender_id_fkey
      foreign key (sender_id) references profiles(id) on delete cascade;

    if exists (select 1 from information_schema.columns
               where table_name = 'chat_messages' and column_name = 'receiver_id') then
      alter table chat_messages drop constraint if exists chat_messages_receiver_id_fkey;
      alter table chat_messages add constraint chat_messages_receiver_id_fkey
        foreign key (receiver_id) references profiles(id) on delete cascade;
    end if;
  end if;

  -- receipts
  if to_regclass('public.receipts') is not null then
    alter table receipts drop constraint if exists receipts_customer_id_fkey;
    alter table receipts add constraint receipts_customer_id_fkey
      foreign key (customer_id) references profiles(id) on delete cascade;

    alter table receipts drop constraint if exists receipts_partner_id_fkey;
    alter table receipts add constraint receipts_partner_id_fkey
      foreign key (partner_id) references profiles(id) on delete cascade;
  end if;

  -- reviews
  if to_regclass('public.reviews') is not null then
    alter table reviews drop constraint if exists reviews_customer_id_fkey;
    alter table reviews add constraint reviews_customer_id_fkey
      foreign key (customer_id) references profiles(id) on delete cascade;

    alter table reviews drop constraint if exists reviews_partner_id_fkey;
    alter table reviews add constraint reviews_partner_id_fkey
      foreign key (partner_id) references profiles(id) on delete cascade;
  end if;

  -- work_history
  if to_regclass('public.work_history') is not null then
    alter table work_history drop constraint if exists work_history_partner_id_fkey;
    alter table work_history add constraint work_history_partner_id_fkey
      foreign key (partner_id) references profiles(id) on delete cascade;

    alter table work_history drop constraint if exists work_history_customer_id_fkey;
    alter table work_history add constraint work_history_customer_id_fkey
      foreign key (customer_id) references profiles(id) on delete cascade;

    if exists (select 1 from information_schema.columns
               where table_name = 'work_history' and column_name = 'post_id') then
      alter table work_history drop constraint if exists work_history_post_id_fkey;
      alter table work_history add constraint work_history_post_id_fkey
        foreign key (post_id) references posts(id) on delete cascade;
    end if;
  end if;

  -- booking_locations
  if to_regclass('public.booking_locations') is not null then
    alter table booking_locations drop constraint if exists booking_locations_user_id_fkey;
    alter table booking_locations add constraint booking_locations_user_id_fkey
      foreign key (user_id) references profiles(id) on delete cascade;
  end if;
end$$;

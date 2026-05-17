-- Defensive: make sure chat_messages is in the supabase_realtime publication.
-- (schema.sql adds it on initial deploy, but if the DB was reset partially
--  or the table was recreated, it can fall off the publication, which makes
--  postgres_changes subscriptions silently deliver nothing.)

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;

-- Quick verification query (run manually after to confirm):
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
-- Expected to include: chat_messages, notifications

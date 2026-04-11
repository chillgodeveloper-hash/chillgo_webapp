alter table profiles add column if not exists line_user_id text;
create index if not exists idx_profiles_line_user_id on profiles(line_user_id);

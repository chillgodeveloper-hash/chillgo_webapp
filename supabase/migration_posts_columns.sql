ALTER TABLE posts ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS lng numeric;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS available_start date;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS available_end date;

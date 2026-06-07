-- ---------------------------------------------------------------------
-- New Partner Profile forms (Tour Guide & Driver) — ChillGo_ProfileForms.
-- Adds the columns the redesigned setup/edit forms write to.
-- Reuses existing columns where possible: nickname, vehicle_brand,
-- vehicle_year, vehicle_seats, bank_* , promptpay, terms_accepted(_at),
-- and profiles.avatar_url / partner_profiles.portfolio_images for photos.
-- ---------------------------------------------------------------------

ALTER TABLE partner_profiles
  -- Shared (guide + driver)
  ADD COLUMN IF NOT EXISTS intro_video_url text,
  ADD COLUMN IF NOT EXISTS available_days jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS self_rating int,

  -- Tour Guide
  ADD COLUMN IF NOT EXISTS trips_done int,
  ADD COLUMN IF NOT EXISTS languages_spoken jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS specialties jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS guide_styles jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS coverage_area text,
  ADD COLUMN IF NOT EXISTS motto text,
  ADD COLUMN IF NOT EXISTS client_types jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS max_group_size int,
  ADD COLUMN IF NOT EXISTS experience_years text,
  ADD COLUMN IF NOT EXISTS proud_story text,

  -- Driver
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pets_policy text,
  ADD COLUMN IF NOT EXISTS special_luggage jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS public_license text,
  ADD COLUMN IF NOT EXISTS insurance_class text,
  ADD COLUMN IF NOT EXISTS driving_experience_years text,
  ADD COLUMN IF NOT EXISTS extra_services jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS service_personality text,
  ADD COLUMN IF NOT EXISTS recommended_places text;

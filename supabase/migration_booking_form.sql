-- ---------------------------------------------------------------------
-- Booking & Customization Form — ChillGo_BookingForm.
-- Adds the fields the customer fills in the booking pop-up so the trip
-- can be customised. All data stored on the booking row.
-- ---------------------------------------------------------------------

ALTER TABLE bookings
  -- Section 1: Traveler information
  ADD COLUMN IF NOT EXISTS traveler_name text,
  ADD COLUMN IF NOT EXISTS traveler_age int,
  ADD COLUMN IF NOT EXISTS contact_channel text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS emergency_channel text,
  ADD COLUMN IF NOT EXISTS group_members jsonb DEFAULT '[]',

  -- Section 2: Preferences & lifestyle
  ADD COLUMN IF NOT EXISTS fitness_level text,
  ADD COLUMN IF NOT EXISTS daily_budget text,
  ADD COLUMN IF NOT EXISTS likes text,
  ADD COLUMN IF NOT EXISTS dislikes text,
  ADD COLUMN IF NOT EXISTS lifestyle text,
  ADD COLUMN IF NOT EXISTS special_expectations text,

  -- Section 3: Safety & health
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS medical_conditions text,
  ADD COLUMN IF NOT EXISTS regular_medication text,
  ADD COLUMN IF NOT EXISTS food_allergies text,

  -- Section 4: Confirmation & consent
  ADD COLUMN IF NOT EXISTS consent_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_health boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_truth boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS traveler_signature text,
  ADD COLUMN IF NOT EXISTS signed_date date;

-- Migration: Add phone_visible and working_hours fields

-- Add phone_visible to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT true;

-- Add working_hours to shops table (JSON format: {"monday": {"start": "09:00", "end": "18:00"}, ...})
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN users.phone_visible IS 'Whether the user phone number is visible to other users';
COMMENT ON COLUMN shops.working_hours IS 'Shop working hours in JSON format by day';

-- Example working_hours format:
-- {
--   "monday": {"open": "09:00", "close": "18:00", "closed": false},
--   "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
--   "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
--   "thursday": {"open": "09:00", "close": "18:00", "closed": false},
--   "friday": {"open": "09:00", "close": "18:00", "closed": false},
--   "saturday": {"open": "09:00", "close": "14:00", "closed": false},
--   "sunday": {"open": "00:00", "close": "00:00", "closed": true}
-- }

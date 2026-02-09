-- Migration: Ensure shops table has all required columns
-- This migration is idempotent (safe to run multiple times)

-- Add phone_visible to shops table if not exists
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT true;

-- Add working_hours to shops table if not exists  
ALTER TABLE shops ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT NULL;

-- Add owner_id to shops table if not exists (should already exist from schema)
-- ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- FIX LISTINGS SCHEMA - ADD MISSING COLUMNS
-- =====================================================
-- Add location_value and price columns that were missing from the listings table
-- =====================================================

-- Add location_value column
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS location_value text;

-- Add price column (NOT NULL with a default for existing rows, then remove default)
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;

-- Remove default so future inserts must provide price
ALTER TABLE public.listings 
  ALTER COLUMN price DROP DEFAULT;

-- Verification query (commented out):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'listings'
-- AND column_name IN ('location_value', 'price')
-- ORDER BY column_name;


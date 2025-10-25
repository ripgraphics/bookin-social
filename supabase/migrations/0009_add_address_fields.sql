-- =====================================================
-- ADD FULL ADDRESS FIELDS TO LISTINGS TABLE
-- =====================================================
-- This migration replaces location_value with comprehensive address fields
-- for precise geocoding and better user experience.
-- =====================================================

-- Add new address columns
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON public.listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_country_code ON public.listings(country_code);

-- Migrate existing location_value data (if any exists)
-- This attempts to preserve existing country codes by setting them as country_code
UPDATE public.listings 
SET 
  country_code = location_value,
  formatted_address = COALESCE(location_value, 'Location not specified')
WHERE location_value IS NOT NULL AND location_value != '';

-- Drop the old location_value column
-- Note: Commenting this out for now in case rollback is needed
-- ALTER TABLE public.listings DROP COLUMN IF EXISTS location_value;

-- Add helpful comment
COMMENT ON COLUMN public.listings.formatted_address IS 'Human-readable full address from geocoding service';
COMMENT ON COLUMN public.listings.latitude IS 'Latitude coordinate for map display';
COMMENT ON COLUMN public.listings.longitude IS 'Longitude coordinate for map display';
COMMENT ON COLUMN public.listings.city IS 'City/locality for search and display';
COMMENT ON COLUMN public.listings.country_code IS 'ISO 3166-1 alpha-2 country code';


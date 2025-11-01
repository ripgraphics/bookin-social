-- Add category and images columns to products table if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Remove segment_id from suppliers
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS segment_id;

-- Drop product_segments table
DROP TABLE IF EXISTS public.product_segments;
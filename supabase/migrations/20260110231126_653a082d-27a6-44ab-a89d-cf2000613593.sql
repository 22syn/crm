-- Remove specialties column and add segment_id reference
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS specialties;

ALTER TABLE public.suppliers ADD COLUMN segment_id uuid REFERENCES public.product_segments(id) ON DELETE SET NULL;
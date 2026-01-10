-- Add unique constraint to ensure one quote per lead
ALTER TABLE public.quotes
ADD CONSTRAINT quotes_lead_id_unique UNIQUE (lead_id);
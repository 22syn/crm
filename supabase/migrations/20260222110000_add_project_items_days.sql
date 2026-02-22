-- Add days column to op_project_items for per-day pricing
-- Cost per line = item.price (per day) × quantity × days
ALTER TABLE public.op_project_items
  ADD COLUMN IF NOT EXISTS days NUMERIC NOT NULL DEFAULT 1;

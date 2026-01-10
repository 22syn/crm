-- Create enum for supplier categories
CREATE TYPE public.supplier_category AS ENUM ('sofas', 'cabinets', 'chairs', 'tables');

-- Add category column to suppliers
ALTER TABLE public.suppliers 
ADD COLUMN category public.supplier_category;
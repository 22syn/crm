-- Add status field to customers
CREATE TYPE customer_status AS ENUM ('new', 'in_progress', 'closed', 'returning');
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status customer_status NOT NULL DEFAULT 'new';

-- Make phone required for customers (update existing nulls first)
UPDATE public.customers SET phone = 'N/A' WHERE phone IS NULL;
ALTER TABLE public.customers ALTER COLUMN phone SET NOT NULL;

-- Make email required for customers (update existing nulls first)  
UPDATE public.customers SET email = 'N/A' WHERE email IS NULL;
ALTER TABLE public.customers ALTER COLUMN email SET NOT NULL;

-- Make contact_name required for suppliers (update existing nulls first)
UPDATE public.suppliers SET contact_name = name WHERE contact_name IS NULL;
ALTER TABLE public.suppliers ALTER COLUMN contact_name SET NOT NULL;

-- Make phone required for suppliers (update existing nulls first)
UPDATE public.suppliers SET phone = 'N/A' WHERE phone IS NULL;
ALTER TABLE public.suppliers ALTER COLUMN phone SET NOT NULL;

-- Make category required for suppliers (update existing nulls first)
UPDATE public.suppliers SET category = 'sofas' WHERE category IS NULL;
ALTER TABLE public.suppliers ALTER COLUMN category SET NOT NULL;

-- Make customer_phone required for leads (update existing nulls first)
UPDATE public.leads SET customer_phone = 'N/A' WHERE customer_phone IS NULL;
ALTER TABLE public.leads ALTER COLUMN customer_phone SET NOT NULL;
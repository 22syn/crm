-- Remove foreign key from deals table that references orders
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_order_id_fkey;
ALTER TABLE public.deals DROP COLUMN IF EXISTS order_id;

-- Drop documents table (depends on orders)
DROP TABLE IF EXISTS public.documents;

-- Drop order_items table (depends on orders)
DROP TABLE IF EXISTS public.order_items;

-- Drop orders table
DROP TABLE IF EXISTS public.orders;

-- Drop the order number sequence
DROP SEQUENCE IF EXISTS public.order_number_seq;
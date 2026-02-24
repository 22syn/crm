-- Add is_active to op_clients for soft "inactive" status
ALTER TABLE public.op_clients
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.op_clients.is_active IS 'When false, client is hidden from project dropdown';

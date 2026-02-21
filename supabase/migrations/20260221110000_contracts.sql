-- Create contracts table (converted from approved quotes)
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL UNIQUE REFERENCES public.quotes(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies (mirror quotes)
CREATE POLICY "CRM users can view contracts" ON public.contracts
  FOR SELECT USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert contracts" ON public.contracts
  FOR INSERT WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update contracts" ON public.contracts
  FOR UPDATE USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete contracts" ON public.contracts
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Contract number sequence
CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;

-- Generate contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.contract_number = 'CT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('contract_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contract_number();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add contracts FK to deals if not exists (deals can reference contract)
-- Note: We use deal_id on contracts to link; deals already have quote_id

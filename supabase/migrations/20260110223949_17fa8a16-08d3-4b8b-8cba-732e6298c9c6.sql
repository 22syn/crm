-- Create deal_stage enum
CREATE TYPE public.deal_stage AS ENUM (
  'proposal',
  'negotiation', 
  'contract_sent',
  'closed_won',
  'closed_lost'
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage deal_stage NOT NULL DEFAULT 'proposal',
  amount NUMERIC NOT NULL DEFAULT 0,
  expected_close_date DATE,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  notes TEXT,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "CRM users can view deals" 
ON public.deals 
FOR SELECT 
USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update deals" 
ON public.deals 
FOR UPDATE 
USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete deals" 
ON public.deals 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for quotes
CREATE POLICY "CRM users can view quotes" ON public.quotes
  FOR SELECT USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert quotes" ON public.quotes
  FOR INSERT WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update quotes" ON public.quotes
  FOR UPDATE USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete quotes" ON public.quotes
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for quote_items
CREATE POLICY "CRM users can view quote_items" ON public.quote_items
  FOR SELECT USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert quote_items" ON public.quote_items
  FOR INSERT WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update quote_items" ON public.quote_items
  FOR UPDATE USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete quote_items" ON public.quote_items
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create sequence for quote numbers
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

-- Create function to generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.quote_number = 'QT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('quote_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Create trigger for quote number generation
CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number();

-- Add trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
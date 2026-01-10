
-- Add customer_address to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS customer_address text;

-- Add customer_address to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_address text;

-- Add dimensions and product_type to quote_items table
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS product_type text;

-- Create product_segments table
CREATE TABLE IF NOT EXISTS public.product_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on product_segments
ALTER TABLE public.product_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_segments
CREATE POLICY "CRM users can view product_segments" ON public.product_segments
  FOR SELECT USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can insert product_segments" ON public.product_segments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product_segments" ON public.product_segments
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product_segments" ON public.product_segments
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on product_segments
CREATE TRIGGER update_product_segments_updated_at
  BEFORE UPDATE ON public.product_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  specialties text[],
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "CRM users can view suppliers" ON public.suppliers
  FOR SELECT USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update suppliers" ON public.suppliers
  FOR UPDATE USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete suppliers" ON public.suppliers
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default product segments
INSERT INTO public.product_segments (name, description) VALUES
  ('סלון', 'ריהוט לסלון'),
  ('חדר שינה', 'ריהוט לחדרי שינה'),
  ('מטבח ופינת אוכל', 'ריהוט למטבח ופינת אוכל'),
  ('חדר עבודה', 'ריהוט למשרד וחדר עבודה'),
  ('חדרי ילדים', 'ריהוט לחדרי ילדים ונוער'),
  ('אחסון', 'פתרונות אחסון'),
  ('חוץ וגינה', 'ריהוט חוץ וגינה')
ON CONFLICT DO NOTHING;

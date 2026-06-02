-- Company settings per module (leads = Hadarya CRM, ad_agency = הר סיני הפקות)
-- Used for quote headers and footers (Stitch Professional Quote Template)
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL UNIQUE,
  name TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: any CRM user (leads or ad_agency) can read
CREATE POLICY "Company settings view" ON public.company_settings
  FOR SELECT USING (has_crm_access(auth.uid()));

-- UPDATE: system admin only (no UI for edit in this phase, but allow future)
CREATE POLICY "Company settings system admin update" ON public.company_settings
  FOR UPDATE USING (has_module_admin(auth.uid(), 'system'));

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: two organizations with full data
INSERT INTO public.company_settings (module, name, address, email, phone, website)
VALUES
  ('leads', 'Hadarya CRM', '123 Business Boulevard, Suite 500, Tech District, San Francisco, CA 94105', 'contact@hadaryacrm.com', '+1 555 123 4567', 'https://hadaryacrm.com'),
  ('ad_agency', 'הר סיני הפקות', 'רחוב החברה 1, תל אביב, ישראל', 'info@harsinai.co.il', '+972 3 1234567', 'https://harsinai.co.il');

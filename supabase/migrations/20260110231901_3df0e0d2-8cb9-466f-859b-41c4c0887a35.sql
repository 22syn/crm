-- Add custom design flag to quote_items
ALTER TABLE public.quote_items 
ADD COLUMN requires_custom_design boolean DEFAULT false,
ADD COLUMN custom_design_notes text;

-- Create design requests table
CREATE TABLE public.design_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  quote_item_id uuid NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  designer_id uuid REFERENCES auth.users(id),
  design_file_url text,
  design_notes text,
  customer_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for design_requests
CREATE POLICY "CRM users can view design_requests" 
ON public.design_requests FOR SELECT 
USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert design_requests" 
ON public.design_requests FOR INSERT 
WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update design_requests" 
ON public.design_requests FOR UPDATE 
USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete design_requests" 
ON public.design_requests FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_design_requests_updated_at
BEFORE UPDATE ON public.design_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for design files
INSERT INTO storage.buckets (id, name, public) VALUES ('designs', 'designs', true);

-- Storage policies for designs bucket
CREATE POLICY "Authenticated users can view designs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "CRM users can upload designs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'designs' AND has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update designs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'designs' AND has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete designs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'designs' AND has_role(auth.uid(), 'admin'::app_role));
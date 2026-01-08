-- Drop existing RLS policies on quotes table
DROP POLICY IF EXISTS "CRM users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "CRM users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "CRM users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;

-- Create new secure RLS policies with explicit role requirement
CREATE POLICY "CRM users can view quotes" 
ON public.quotes 
FOR SELECT 
TO authenticated
USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert quotes" 
ON public.quotes 
FOR INSERT 
TO authenticated
WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can update quotes" 
ON public.quotes 
FOR UPDATE 
TO authenticated
USING (has_crm_access(auth.uid()));

CREATE POLICY "Admins can delete quotes" 
ON public.quotes 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
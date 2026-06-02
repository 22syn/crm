-- payment-proofs bucket for QuoteApproval uploads (audit P1 fix)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: leads module users can upload and read payment proofs
CREATE POLICY "Leads users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND has_module_access(auth.uid(), 'leads'));

CREATE POLICY "Leads users can read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND has_module_access(auth.uid(), 'leads'));

CREATE POLICY "Leads users can update own payment proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-proofs' AND has_module_access(auth.uid(), 'leads'))
WITH CHECK (bucket_id = 'payment-proofs' AND has_module_access(auth.uid(), 'leads'));

-- Deal stages: fulfillment flow after quote approval (הצעת מחיר אושרה → משימות עד שהלקוח מקבל)
-- Replace sales pipeline (proposal/negotiation/contract_sent/closed_won/closed_lost) with fulfillment pipeline

CREATE TYPE public.deal_stage_new AS ENUM (
  'quote_approved',   -- הצעת מחיר אושרה
  'in_production',   -- בתהליך ייצור
  'ready_for_delivery', -- מוכן למשלוח
  'shipped',         -- נשלח
  'delivered',       -- נמסר ללקוח
  'cancelled'        -- בוטל
);

ALTER TABLE public.deals ADD COLUMN stage_new public.deal_stage_new;

UPDATE public.deals SET stage_new = CASE
  WHEN stage::text IN ('proposal', 'negotiation', 'contract_sent') THEN 'quote_approved'::public.deal_stage_new
  WHEN stage::text = 'closed_won' THEN 'delivered'::public.deal_stage_new
  WHEN stage::text = 'closed_lost' THEN 'cancelled'::public.deal_stage_new
  ELSE 'quote_approved'::public.deal_stage_new
END;

ALTER TABLE public.deals DROP COLUMN stage;
ALTER TABLE public.deals RENAME COLUMN stage_new TO stage;
ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'quote_approved'::public.deal_stage_new;
ALTER TABLE public.deals ALTER COLUMN stage SET NOT NULL;

DROP TYPE public.deal_stage;
ALTER TYPE public.deal_stage_new RENAME TO deal_stage;

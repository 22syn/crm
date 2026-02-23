-- Ad Agency Replace Excel: schema changes for budget sections, items, and project enhancements
-- Task 1 from 2025-02-23-ad-agency-replace-excel-design.md

-- 1. op_budget_sections table
CREATE TABLE public.op_budget_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS policy for CRM users
ALTER TABLE public.op_budget_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users op_budget_sections" ON public.op_budget_sections
  FOR ALL USING (has_crm_access(auth.uid()));

-- 3. Seed sections
INSERT INTO public.op_budget_sections (name, sort_order) VALUES
  ('1. צוות', 1),
  ('2. הוצאות הפקה', 2),
  ('3. ארט סטיילינג ומשתתפים', 3),
  ('4. פוסט פרודקשן', 4);

-- 4. op_items: add section_id
ALTER TABLE public.op_items
  ADD COLUMN section_id UUID REFERENCES public.op_budget_sections(id) ON DELETE SET NULL;

-- 5. op_project_items: add prep_days and extras
ALTER TABLE public.op_project_items
  ADD COLUMN prep_days NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN extras NUMERIC NOT NULL DEFAULT 0;

-- 6. op_projects: add description, locations_schedule, deliverables, production_fee_percent, insurance, discount
ALTER TABLE public.op_projects
  ADD COLUMN description TEXT,
  ADD COLUMN locations_schedule TEXT,
  ADD COLUMN deliverables TEXT,
  ADD COLUMN production_fee_percent NUMERIC NOT NULL DEFAULT 15,
  ADD COLUMN insurance NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN discount NUMERIC NOT NULL DEFAULT 0;

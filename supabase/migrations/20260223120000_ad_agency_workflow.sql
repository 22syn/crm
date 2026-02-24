-- Ad Agency Workflow (part 1): new project statuses, payment_terms, quotes.project_id
-- Design: docs/plans/2025-02-23-ad-agency-dashboard-and-workflow-design.md
-- Note: Enum ADD VALUE and UPDATE cannot run in same transaction (PostgreSQL limitation)

-- 1. New project statuses (enum values must commit before use)
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'waiting_for_approval';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'planning';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'execution';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'collection';

-- 2. Payment terms for clients
ALTER TABLE public.op_clients ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- 3. project_id for quotes (links ad-agency project to quote)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.op_projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON public.quotes(project_id);

-- Leads access must follow the leads module only.
-- These older policies were left behind when module roles were introduced, and because
-- Postgres ORs permissive policies together they widened access:
--   * "CRM users can insert leads" / "CRM users can update leads" use has_crm_access(),
--     which is true for ANY module role, so ad-agency and system users could create leads.
--   * "Admins can delete leads" uses the legacy user_roles table (exists on live only).
-- The "Leads module insert / update / admin delete / view" policies stay and cover every
-- legitimate case. Checked on live 2026-11-07: the one legacy admin is also a leads admin,
-- so no real user loses access.
DROP POLICY IF EXISTS "CRM users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "CRM users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

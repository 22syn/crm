-- Only ad-agency admins may delete projects (decided by Kobi, 2026-11-07).
-- Before this, one "Ad agency op_projects" policy covered every command, so any ad-agency
-- user could delete a project, and with it (ON DELETE CASCADE) its tasks and items.
-- View, create and edit stay open to every ad-agency user, exactly as before.
DROP POLICY IF EXISTS "Ad agency op_projects" ON public.op_projects;
DROP POLICY IF EXISTS "Ad agency op_projects view" ON public.op_projects;
DROP POLICY IF EXISTS "Ad agency op_projects insert" ON public.op_projects;
DROP POLICY IF EXISTS "Ad agency op_projects update" ON public.op_projects;
DROP POLICY IF EXISTS "Ad agency op_projects admin delete" ON public.op_projects;

CREATE POLICY "Ad agency op_projects view" ON public.op_projects
  FOR SELECT USING (public.has_module_access(auth.uid(), 'ad_agency'));

CREATE POLICY "Ad agency op_projects insert" ON public.op_projects
  FOR INSERT WITH CHECK (public.has_module_access(auth.uid(), 'ad_agency'));

CREATE POLICY "Ad agency op_projects update" ON public.op_projects
  FOR UPDATE USING (public.has_module_access(auth.uid(), 'ad_agency'))
  WITH CHECK (public.has_module_access(auth.uid(), 'ad_agency'));

CREATE POLICY "Ad agency op_projects admin delete" ON public.op_projects
  FOR DELETE USING (public.has_module_admin(auth.uid(), 'ad_agency'));

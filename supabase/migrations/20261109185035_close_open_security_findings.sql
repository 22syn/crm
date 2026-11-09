-- Closes the open findings from the 2026-11-09 post-deploy security review.

-- 1. Project contents: only ad-agency admins delete items, subtasks and budget sections
--    (decided by Kobi, 2026-11-09). Any ad-agency user may still delete a task, as the
--    tasks screen does today. Before this, one ALL policy per table let any ad-agency user
--    empty a project even though only admins may delete the project itself.
--    Deleting a task still removes its subtasks: foreign-key cascades are not subject to RLS.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['op_project_items', 'op_task_subtasks', 'op_budget_sections'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Ad agency ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Ad agency ' || t || ' view', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Ad agency ' || t || ' insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Ad agency ' || t || ' update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Ad agency ' || t || ' admin delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (public.has_module_access(auth.uid(), ''ad_agency''))',
      'Ad agency ' || t || ' view', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.has_module_access(auth.uid(), ''ad_agency''))',
      'Ad agency ' || t || ' insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.has_module_access(auth.uid(), ''ad_agency'')) '
      'WITH CHECK (public.has_module_access(auth.uid(), ''ad_agency''))',
      'Ad agency ' || t || ' update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (public.has_module_admin(auth.uid(), ''ad_agency''))',
      'Ad agency ' || t || ' admin delete', t);
  END LOOP;
END $$;

-- 2. Company settings: each user reads only the rows of modules they belong to
--    (system admins manage all of them). Before this, any CRM user read every module's
--    contact details.
DROP POLICY IF EXISTS "Company settings view" ON public.company_settings;
CREATE POLICY "Company settings view" ON public.company_settings
  FOR SELECT USING (
    public.has_module_access(auth.uid(), module)
    OR public.has_module_admin(auth.uid(), 'system')
  );

-- 3. Profiles: a user sees the people they work with (same module), plus super admins;
--    system admins see everyone (they manage members). Before this, any CRM user read
--    every profile, including other modules' users and their emails.
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _viewer IS NOT NULL AND (
    _viewer = _target
    OR is_super_admin(_viewer)
    OR has_module_admin(_viewer, 'system')
    OR (is_super_admin(_target) AND has_crm_access(_viewer))
    OR EXISTS (
      SELECT 1
      FROM user_module_roles viewer_role
      JOIN user_module_roles target_role ON target_role.module = viewer_role.module
      WHERE viewer_role.user_id = _viewer AND target_role.user_id = _target
    )
  )
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "CRM users can view all profiles for team list" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view profiles" ON public.profiles;
CREATE POLICY "Team members can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_view_profile(auth.uid(), user_id));

-- 4. Lead comments: a comment is always posted under your own name, and only leads users
--    may delete their own comments.
DROP POLICY IF EXISTS "Leads module insert lead_comments" ON public.lead_comments;
CREATE POLICY "Leads module insert lead_comments" ON public.lead_comments
  FOR INSERT WITH CHECK (
    public.has_module_access(auth.uid(), 'leads') AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "CRM users can delete own lead_comments" ON public.lead_comments;
DROP POLICY IF EXISTS "Leads users can delete own lead_comments" ON public.lead_comments;
CREATE POLICY "Leads users can delete own lead_comments" ON public.lead_comments
  FOR DELETE USING (
    public.has_module_access(auth.uid(), 'leads') AND user_id = auth.uid()
  );

-- 5. Design files: only leads users list, upload or change them; only leads admins delete.
--    The bucket stays public because saved design links (design_requests.design_file_url)
--    are public URLs that are also shared outside the CRM. Before this, any signed-in
--    account, including a stranger who signed up, could list and download every file.
DROP POLICY IF EXISTS "Authenticated users can view designs" ON storage.objects;
DROP POLICY IF EXISTS "CRM users can upload designs" ON storage.objects;
DROP POLICY IF EXISTS "CRM users can update designs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete designs" ON storage.objects;
DROP POLICY IF EXISTS "Leads users can view designs" ON storage.objects;
DROP POLICY IF EXISTS "Leads users can upload designs" ON storage.objects;
DROP POLICY IF EXISTS "Leads users can update designs" ON storage.objects;
DROP POLICY IF EXISTS "Leads admins can delete designs" ON storage.objects;

CREATE POLICY "Leads users can view designs" ON storage.objects
  FOR SELECT USING (bucket_id = 'designs' AND public.has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads users can upload designs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'designs' AND public.has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads users can update designs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'designs' AND public.has_module_access(auth.uid(), 'leads'))
  WITH CHECK (bucket_id = 'designs' AND public.has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads admins can delete designs" ON storage.objects
  FOR DELETE USING (bucket_id = 'designs' AND public.has_module_admin(auth.uid(), 'leads'));

-- 6. Legacy admin role (user_roles 'admin'): drop the policies that still relied on it.
--    Only the super admin holds it today, and super admins are covered by the module helpers.
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

DROP POLICY IF EXISTS "System admins view module roles" ON public.user_module_roles;
DROP POLICY IF EXISTS "System admins insert module roles" ON public.user_module_roles;
DROP POLICY IF EXISTS "System admins delete module roles" ON public.user_module_roles;
CREATE POLICY "System admins view module roles" ON public.user_module_roles
  FOR SELECT USING (public.has_module_admin(auth.uid(), 'system'));
CREATE POLICY "System admins insert module roles" ON public.user_module_roles
  FOR INSERT WITH CHECK (public.has_module_admin(auth.uid(), 'system'));
CREATE POLICY "System admins delete module roles" ON public.user_module_roles
  FOR DELETE USING (public.has_module_admin(auth.uid(), 'system'));

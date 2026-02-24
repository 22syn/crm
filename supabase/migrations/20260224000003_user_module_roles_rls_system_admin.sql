-- Allow system admins and super_admins to manage user_module_roles,
-- not just users with has_role('admin') from user_roles.
DROP POLICY IF EXISTS "Admins can view all module roles" ON public.user_module_roles;
DROP POLICY IF EXISTS "Admins can insert module roles" ON public.user_module_roles;
DROP POLICY IF EXISTS "Admins can delete module roles" ON public.user_module_roles;

CREATE POLICY "System admins view module roles" ON public.user_module_roles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
    OR public.has_module_admin(auth.uid(), 'system')
  );

CREATE POLICY "System admins insert module roles" ON public.user_module_roles
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
    OR public.has_module_admin(auth.uid(), 'system')
  );

CREATE POLICY "System admins delete module roles" ON public.user_module_roles
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
    OR public.has_module_admin(auth.uid(), 'system')
  );

-- Modular permissions: profiles.super_admin + user_module_roles
-- Replaces global user_roles with per-module admin/user.

-- 1. Add super_admin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Create user_module_roles table
CREATE TABLE IF NOT EXISTS public.user_module_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('leads', 'ad_agency', 'system')),
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module)
);

ALTER TABLE public.user_module_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrate from user_roles (admin→admin, sales→user)
INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'leads', CASE WHEN role::text = 'admin' THEN 'admin' ELSE 'user' END
FROM public.user_roles
ON CONFLICT (user_id, module) DO NOTHING;

INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'ad_agency', CASE WHEN role::text = 'admin' THEN 'admin' ELSE 'user' END
FROM public.user_roles
ON CONFLICT (user_id, module) DO NOTHING;

-- Old admins get system admin
INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'system', 'admin'
FROM public.user_roles
WHERE role = 'admin'::app_role
ON CONFLICT (user_id, module) DO NOTHING;

-- First admin becomes super_admin
UPDATE public.profiles
SET super_admin = true
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1
)
AND NOT super_admin;

-- 4. Helper: is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT super_admin FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- 5. Helper: has any access to module
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_module_roles
    WHERE user_id = _user_id AND module = _module
  )
$$;

-- 6. Helper: is admin of module
CREATE OR REPLACE FUNCTION public.has_module_admin(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_module_roles
    WHERE user_id = _user_id AND module = _module AND role = 'admin'
  )
$$;

-- 7. Update has_crm_access: true if has any module access
CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (SELECT 1 FROM public.user_module_roles WHERE user_id = _user_id)
$$;

-- 8. RLS for user_module_roles (users read own; admins manage via has_role until A5)
CREATE POLICY "Users can view own module roles" ON public.user_module_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all module roles" ON public.user_module_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert module roles" ON public.user_module_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete module roles" ON public.user_module_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

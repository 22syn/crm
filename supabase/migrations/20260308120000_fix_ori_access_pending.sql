-- Fix "Access Pending" for users who have user_roles but empty user_module_roles.
-- 1. Ensure users can read their own module roles (policy may have been dropped).
DROP POLICY IF EXISTS "Users can view own module roles" ON public.user_module_roles;
CREATE POLICY "Users can view own module roles" ON public.user_module_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Ensure ori@harsinai.co.il has ad_agency access (idempotent).
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.profiles WHERE email = 'ori@harsinai.co.il' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_module_roles (user_id, module, role)
    VALUES (v_user_id, 'ad_agency', 'user')
    ON CONFLICT (user_id, module) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END $$;

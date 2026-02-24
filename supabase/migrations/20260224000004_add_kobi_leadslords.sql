-- Add kobi@leadslords.com with full permissions (all modules, admin)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.profiles WHERE email = 'kobi@leadslords.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_module_roles (user_id, module, role)
    VALUES
      (v_user_id, 'leads', 'admin'),
      (v_user_id, 'ad_agency', 'admin'),
      (v_user_id, 'system', 'admin')
    ON CONFLICT (user_id, module) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END $$;

-- Restrict ori@harsinai.co.il to ad_agency (משרד פרסום) only.
-- Idempotent: removes all other modules and ensures only ad_agency remains.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.profiles WHERE email = 'ori@harsinai.co.il' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.user_module_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_module_roles (user_id, module, role) VALUES (v_user_id, 'ad_agency', 'user')
    ON CONFLICT (user_id, module) DO UPDATE SET role = EXCLUDED.role;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
  END IF;
END $$;

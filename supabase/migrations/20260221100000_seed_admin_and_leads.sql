-- Seed admin user (kobihazout2@gmail.com) and 100 sample leads (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT := crypt('K5991322h', gen_salt('bf'));
  v_exists BOOLEAN;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kobihazout2@gmail.com' LIMIT 1;
  v_exists := (v_user_id IS NOT NULL);

  IF NOT v_exists THEN
    v_user_id := gen_random_uuid();
    -- 1. Insert user into auth.users
    INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'kobihazout2@gmail.com',
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "Kobi Hazout"}',
    NOW(),
    NOW()
  );

    -- 2. Link identity for login
    INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    format('{"sub": "%s", "email": "kobihazout2@gmail.com"}', v_user_id)::jsonb,
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

    -- 3. handle_new_user trigger creates profile automatically
  END IF;

  -- 4. Add as admin in user_roles (always ensure)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. Insert 100 sample leads only if user is new (avoid duplicates on re-run)
  IF NOT v_exists THEN
    INSERT INTO public.leads (
    customer_name, customer_phone, customer_email, source, status, notes, assigned_to,
    customer_address, meeting_date, created_at, updated_at
  )
  SELECT
    'לקוח ' || (i + 1) as customer_name,
    '050-' || lpad((1000000 + (i * 12345) % 9999999)::text, 7, '0') as customer_phone,
    'lead' || (i + 1) || '@example.com' as customer_email,
    (ARRAY['instagram','website','architects','organic','facebook'])[1 + (i % 5)]::lead_source as source,
    (ARRAY['new','in_process','meeting_scheduled','meeting_done','waiting_for_approval','done','not_done'])[1 + (i % 7)]::lead_status as status,
    CASE WHEN i % 4 = 0 THEN 'הערה לדוגמה עבור ליד ' || (i + 1) ELSE NULL END as notes,
    v_user_id as assigned_to,
    CASE WHEN i % 3 = 0 THEN 'כתובת ' || (i + 1) || ', תל אביב' ELSE NULL END as customer_address,
    CASE WHEN i % 7 IN (2,3,4) THEN CURRENT_DATE + (i % 14) ELSE NULL END as meeting_date,
    NOW() - (i * interval '1 day') as created_at,
    NOW() as updated_at
    FROM generate_series(0, 99) i;
  END IF;
END $$;

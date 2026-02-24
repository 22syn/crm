-- Fix login for kobihazout2@gmail.com - run in SQL Editor
-- IMPORTANT: Replace YOUR_ADMIN_PASSWORD below with the actual password. Never commit real passwords.
-- 500 error is caused by NULL confirmation_token/recovery_token on manual SQL insert
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Fix NULL token columns (causes "converting NULL to string" → 500)
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE email = 'kobihazout2@gmail.com';

-- 2. Reset password (replace YOUR_ADMIN_PASSWORD before running)
UPDATE auth.users 
SET encrypted_password = crypt('YOUR_ADMIN_PASSWORD', gen_salt('bf')) 
WHERE email = 'kobihazout2@gmail.com';

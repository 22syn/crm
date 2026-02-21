-- Fix login for kobihazout2@gmail.com - run in SQL Editor
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

-- 2. Reset password
UPDATE auth.users 
SET encrypted_password = crypt('K5991322h', gen_salt('bf')) 
WHERE email = 'kobihazout2@gmail.com';

-- Post-deploy security review, 2026-11-09.
--
-- 1. Signed-in users could rewrite any column of their own profile, including `email`.
--    profiles.email is not unique, and the invite-user function used to find "the existing
--    user" by profiles.email. So a stranger (public sign-up is open) could copy a waiting
--    user's email onto their own profile and receive the roles an admin meant for that user.
--    The app never updates profiles from the browser, so only the two personal display
--    fields stay editable. The super_admin trigger guard stays as a second layer.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

-- 2. invite-user now finds an existing account by its sign-in email (auth.users), which
--    the user cannot edit. Only the service role (edge functions) may call this.
CREATE OR REPLACE FUNCTION public.user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_id_by_email(text) TO service_role;

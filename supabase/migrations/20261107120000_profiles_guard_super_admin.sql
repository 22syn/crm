-- Close a privilege escalation: the "Users can update their own profile" policy has no column
-- limit, so any signed-in user could set their own profiles.super_admin = true in one request
-- and gain every module plus team management.
-- Only an existing super admin may grant or revoke super_admin. Calls without a user
-- (service role, setup-client's direct connection, the signup trigger) are allowed.
CREATE OR REPLACE FUNCTION public.profiles_guard_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  previous_value BOOLEAN := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    previous_value := OLD.super_admin;
  END IF;

  IF NEW.super_admin IS DISTINCT FROM previous_value
     AND auth.uid() IS NOT NULL
     AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can change super admin access'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_guard_super_admin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_super_admin();

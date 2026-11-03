-- Per-client branding + feature flags on company_settings.
-- The app reads these with "Xsheva CRM" / /logo.png fallbacks, so it runs fine before this is applied.

ALTER TABLE public.company_settings
  ADD COLUMN logo_url TEXT,
  ADD COLUMN primary_color TEXT,
  ADD COLUMN sender_email TEXT,
  ADD COLUMN features JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Values end up in <img src> and inline styles, so constrain them at the source too.
ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_primary_color_hex
    CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT company_settings_logo_url_safe
    CHECK (logo_url IS NULL OR logo_url ~ '^(https://|/[^/])'),
  ADD CONSTRAINT company_settings_features_object
    CHECK (jsonb_typeof(features) = 'object');

-- Module admins manage their own module's row. The existing system-admin UPDATE policy stays.
CREATE POLICY "Company settings module admin update" ON public.company_settings
  FOR UPDATE
  USING (has_module_admin(auth.uid(), module))
  WITH CHECK (has_module_admin(auth.uid(), module));

CREATE POLICY "Company settings module admin insert" ON public.company_settings
  FOR INSERT
  WITH CHECK (has_module_admin(auth.uid(), module));

-- Feature flags are what a client is sold, so only super admins (Xsheva) may change them.
-- Calls without a user (service role, setup scripts) are allowed.
CREATE OR REPLACE FUNCTION public.company_settings_guard_features()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  previous_features JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    previous_features := OLD.features;
  END IF;

  IF NEW.features IS DISTINCT FROM previous_features
     AND auth.uid() IS NOT NULL
     AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can change feature flags'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER company_settings_guard_features
  BEFORE INSERT OR UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.company_settings_guard_features();

-- The login page renders before sign-in, when RLS hides company_settings.
-- Expose only the public brand fields, never contact details or flags.
CREATE OR REPLACE FUNCTION public.get_public_branding(_module TEXT)
RETURNS TABLE (name TEXT, logo_url TEXT, primary_color TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cs.name, cs.logo_url, cs.primary_color
  FROM public.company_settings cs
  WHERE cs.module = _module
$$;

REVOKE ALL ON FUNCTION public.get_public_branding(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branding(TEXT) TO anon, authenticated;

-- Per-client language. Hebrew renders the app right-to-left, English left-to-right.
-- The app falls back to today's behavior (ad agency Hebrew, CRM English) until this is applied.

ALTER TABLE public.company_settings
  ADD COLUMN language TEXT NOT NULL DEFAULT 'he'
    CONSTRAINT company_settings_language_supported CHECK (language IN ('he', 'en'));

-- Existing demo rows keep the language they show today. New clients set it in the setup script.
UPDATE public.company_settings SET language = 'en' WHERE module = 'leads';

-- The login page needs the language before sign-in. Changing the result columns requires a drop.
DROP FUNCTION public.get_public_branding(TEXT);

CREATE FUNCTION public.get_public_branding(_module TEXT)
RETURNS TABLE (name TEXT, logo_url TEXT, primary_color TEXT, language TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cs.name, cs.logo_url, cs.primary_color, cs.language
  FROM public.company_settings cs
  WHERE cs.module = _module
$$;

REVOKE ALL ON FUNCTION public.get_public_branding(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branding(TEXT) TO anon, authenticated;

import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings, usePublicBranding } from "@/hooks/useCompanySettings";
import { type Branding, getBranding, getLoginBrandModule, getUserBrandModule } from "@/lib/branding";
import { type AppLanguage, getLanguage } from "@/lib/locale";

const LOGIN_BRAND_MODULE = getLoginBrandModule(import.meta.env.VITE_BRAND_MODULE);

interface BrandingState {
  readonly branding: Branding;
  readonly isLoading: boolean;
}

/** Branding for signed-in screens, taken from the user's first accessible module. */
export function useAppBranding(): BrandingState {
  const { canAccessModule } = useAuth();
  const { data, isLoading } = useCompanySettings(getUserBrandModule(canAccessModule));
  return { branding: getBranding(data), isLoading };
}

interface LoginBrandingState extends BrandingState {
  readonly language: AppLanguage;
}

/** Branding and language for the public login page (Xsheva defaults on a shared deployment). */
export function useLoginBranding(): LoginBrandingState {
  const { data, isLoading } = usePublicBranding(LOGIN_BRAND_MODULE);
  return { branding: getBranding(data), language: getLanguage(data?.language, LOGIN_BRAND_MODULE), isLoading };
}

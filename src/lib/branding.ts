/**
 * Per-client branding resolved from company_settings, with Xsheva defaults
 * for when the row is missing, empty, or the branding columns don't exist yet.
 */
export const DEFAULT_BRAND_NAME = "Xsheva CRM";
export const DEFAULT_LOGO_URL = "/logo.png";

export const COMPANY_MODULES = ["leads", "ad_agency"] as const;
export type CompanyModule = (typeof COMPANY_MODULES)[number];

/** Module whose branding the public login page shows. */
const DEFAULT_LOGIN_BRAND_MODULE: CompanyModule = "leads";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
// https URLs or same-origin paths; rejects protocol-relative "//host" and javascript: URLs.
const SAFE_LOGO_URL_PATTERN = /^(https:\/\/|\/[^/])/;

export interface BrandingSource {
  name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
}

export interface Branding {
  readonly name: string;
  readonly logoUrl: string;
  readonly primaryColor?: string;
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function isSafeLogoUrl(value: string): boolean {
  return SAFE_LOGO_URL_PATTERN.test(value);
}

export function getBranding(source: BrandingSource | null | undefined): Branding {
  const name = source?.name?.trim();
  const logoUrl = source?.logo_url?.trim();
  const primaryColor = source?.primary_color?.trim();

  return {
    name: name || DEFAULT_BRAND_NAME,
    logoUrl: logoUrl && isSafeLogoUrl(logoUrl) ? logoUrl : DEFAULT_LOGO_URL,
    primaryColor: primaryColor && isValidHexColor(primaryColor) ? primaryColor : undefined,
  };
}

export function getLoginBrandModule(envValue: string | undefined): CompanyModule {
  return COMPANY_MODULES.find((module) => module === envValue) ?? DEFAULT_LOGIN_BRAND_MODULE;
}

/** The sidebar brands the app after the first module the user can open. */
export function getUserBrandModule(
  canAccessModule: (module: CompanyModule) => boolean
): CompanyModule | undefined {
  return COMPANY_MODULES.find(canAccessModule);
}

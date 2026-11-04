import type { CompanyModule } from "./branding";

/**
 * Each client's language is stored on company_settings.language. Hebrew renders the whole
 * app right-to-left (menu on the right); English renders left-to-right.
 */
export const APP_LANGUAGES = ["he", "en"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export type TextDirection = "rtl" | "ltr";

export const DEFAULT_LANGUAGE: AppLanguage = "en";

/**
 * Used only while the language column is missing (before its migration is applied):
 * keeps today's behavior, where the ad agency area is Hebrew and the CRM is English.
 */
const LEGACY_MODULE_LANGUAGE: Readonly<Record<CompanyModule, AppLanguage>> = {
  leads: "en",
  ad_agency: "he",
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return APP_LANGUAGES.some((language) => language === value);
}

export function getDirection(language: AppLanguage): TextDirection {
  return language === "he" ? "rtl" : "ltr";
}

/** The stored language, or the legacy default for the module, or English. */
export function getLanguage(stored: unknown, module: CompanyModule | undefined): AppLanguage {
  if (isAppLanguage(stored)) return stored;
  return module ? LEGACY_MODULE_LANGUAGE[module] : DEFAULT_LANGUAGE;
}

/** The ad agency area uses its own module's language; every other page uses the user's main module. */
export function getAreaModule(
  pathname: string,
  userModule: CompanyModule | undefined
): CompanyModule | undefined {
  return pathname === "/ad-agency" || pathname.startsWith("/ad-agency/") ? "ad_agency" : userModule;
}

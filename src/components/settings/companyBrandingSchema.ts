import { z } from "zod";
import { COMPANY_MODULES, isSafeLogoUrl, isValidHexColor } from "@/lib/branding";
import { APP_LANGUAGES, getLanguage } from "@/lib/locale";
import { type FeatureFlags, parseFeaturesJson } from "@/lib/featureFlags";
import type { CompanySettings, CompanySettingsUpdate } from "@/hooks/useCompanySettings";

const MAX_NAME_LENGTH = 100;

function isParsableFeatures(text: string): boolean {
  try {
    parseFeaturesJson(text);
    return true;
  } catch {
    return false;
  }
}

export const companyBrandingSchema = z.object({
  name: z.string().trim().max(MAX_NAME_LENGTH),
  logoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || isSafeLogoUrl(v), "Use an https:// URL or a path starting with /"),
  primaryColor: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidHexColor(v), "Use a hex color like #1337EC"),
  senderEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  language: z.enum(APP_LANGUAGES),
  featuresJson: z
    .string()
    .refine(isParsableFeatures, 'Use a JSON object of true/false values, e.g. {"quotes": true}'),
});

export type CompanyBrandingValues = z.infer<typeof companyBrandingSchema>;

function formatFeatures(features: FeatureFlags): string {
  return Object.keys(features).length === 0 ? "" : JSON.stringify(features, null, 2);
}

export function getBrandingFormValues(settings: CompanySettings | null | undefined): CompanyBrandingValues {
  return {
    name: settings?.name ?? "",
    logoUrl: settings?.logo_url ?? "",
    primaryColor: settings?.primary_color ?? "",
    senderEmail: settings?.sender_email ?? "",
    language: getLanguage(settings?.language, COMPANY_MODULES.find((module) => module === settings?.module)),
    featuresJson: formatFeatures(settings?.features ?? {}),
  };
}

/** Empty strings become null; features are only sent when the editor may change them. */
export function getBrandingUpdate(
  values: CompanyBrandingValues,
  { canEditFeatures }: { canEditFeatures: boolean }
): CompanySettingsUpdate {
  const update: CompanySettingsUpdate = {
    name: values.name.trim() || null,
    logo_url: values.logoUrl.trim() || null,
    primary_color: values.primaryColor.trim() || null,
    sender_email: values.senderEmail.trim() || null,
    language: values.language,
  };
  return canEditFeatures ? { ...update, features: parseFeaturesJson(values.featuresJson) } : update;
}

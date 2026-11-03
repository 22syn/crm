import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { queryKeys } from "@/lib/query-keys";
import { type FeatureFlags, isFeatureEnabled, normalizeFeatures } from "@/lib/featureFlags";
import type { BrandingSource, CompanyModule } from "@/lib/branding";

export type { CompanyModule } from "@/lib/branding";

type CompanySettingsRow = Tables<"company_settings">;

/** Row with features normalized. Branding columns are undefined until their migration is applied. */
export interface CompanySettings extends Omit<CompanySettingsRow, "features"> {
  readonly features: FeatureFlags;
}

export type CompanySettingsUpdate = Pick<
  TablesUpdate<"company_settings">,
  "name" | "logo_url" | "primary_color" | "sender_email" | "features"
>;

async function fetchCompanySettings(module: CompanyModule): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .eq("module", module)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...data, features: normalizeFeatures(data.features) };
}

export function useCompanySettings(module: CompanyModule | undefined) {
  return useQuery({
    queryKey: queryKeys.companySettings.byModule(module ?? "none"),
    queryFn: () => fetchCompanySettings(module as CompanyModule), // Safe: query is disabled without a module.
    enabled: module !== undefined,
  });
}

export function useIsFeatureEnabled(module: CompanyModule | undefined, key: string): boolean {
  const { data } = useCompanySettings(module);
  return isFeatureEnabled(data?.features, key);
}

async function fetchPublicBranding(module: CompanyModule): Promise<BrandingSource | null> {
  const { data, error } = await supabase.rpc("get_public_branding", { _module: module });
  if (error) {
    // Expected until the branding migration is applied; the login page falls back to defaults.
    console.warn("Public branding unavailable:", error.message);
    return null;
  }
  return data?.[0] ?? null;
}

/** Brand fields readable before sign-in (RLS hides company_settings from anonymous users). */
export function usePublicBranding(module: CompanyModule) {
  return useQuery({
    queryKey: queryKeys.companySettings.publicBranding(module),
    queryFn: () => fetchPublicBranding(module),
    retry: false,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ module, values }: { module: CompanyModule; values: CompanySettingsUpdate }) => {
      const { error } = await supabase
        .from("company_settings")
        .upsert({ module, ...values }, { onConflict: "module" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companySettings.all });
      toast.success("Company settings saved");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Failed to save company settings: " + message);
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CompanyModule = "leads" | "ad_agency";

type CompanySettingsRow = Tables<"company_settings">["Row"];

export function useCompanySettings(module: CompanyModule) {
  return useQuery({
    queryKey: ["company-settings", module],
    queryFn: async (): Promise<CompanySettingsRow | null> => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("module", module)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

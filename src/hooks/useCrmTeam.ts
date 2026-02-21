import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CrmTeamMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export function useCrmTeam() {
  return useQuery({
    queryKey: ["crm-team"],
    queryFn: async (): Promise<CrmTeamMember[]> => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "sales"]);

      if (rolesError) throw rolesError;
      const userIds = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;
      return (profiles ?? []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name ?? null,
        email: p.email ?? null,
      }));
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CrmTeamMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

/** Fetches users who have leads module access (for assignee dropdown) */
export function useCrmTeam() {
  return useQuery({
    queryKey: ["crm-team"],
    queryFn: async (): Promise<CrmTeamMember[]> => {
      const [rolesRes, superAdminRes] = await Promise.all([
        supabase.from("user_module_roles").select("user_id").eq("module", "leads"),
        supabase.from("profiles").select("user_id").eq("super_admin", true),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (superAdminRes.error) throw superAdminRes.error;

      const userIds = new Set<string>();
      (rolesRes.data ?? []).forEach((r) => userIds.add(r.user_id));
      (superAdminRes.data ?? []).forEach((p) => userIds.add(p.user_id));
      const list = [...userIds];
      if (list.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", list);

      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name ?? null,
        email: p.email ?? null,
      }));
    },
  });
}

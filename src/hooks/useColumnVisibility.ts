import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useColumnVisibility(pageKey: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["column-visibility", pageKey, user?.id ?? ""];

  const {
    data: visibleIds = null,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<string[] | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_table_preferences")
        .select("column_visibility")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .eq("view_name", "default")
        .maybeSingle();
      if (error) throw error;
      const raw = data?.column_visibility;
      if (!raw || !Array.isArray(raw)) return null;
      return raw as string[];
    },
    enabled: !!user?.id,
  });

  const setMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_table_preferences").upsert(
        {
          user_id: user.id,
          page_key: pageKey,
          view_name: "default",
          filters: {},
          column_visibility: ids,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,page_key,view_name",
        }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("לא ניתן לשמור העדפות עמודות"),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { data: row } = await supabase
        .from("user_table_preferences")
        .select("id")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .eq("view_name", "default")
        .maybeSingle();
      if (row?.id) {
        const { error } = await supabase
          .from("user_table_preferences")
          .update({
            column_visibility: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("לא ניתן לאפס"),
  });

  return {
    visibleColumnIds: visibleIds,
    isLoading: isLoading && !!user?.id,
    setVisibleColumns: (ids: string[]) => setMutation.mutate(ids),
    setVisibleColumnsPending: setMutation.isPending,
    resetToDefault: () => resetMutation.mutate(),
    resetPending: resetMutation.isPending,
  };
}

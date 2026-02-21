import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TableFilters = Record<string, string | string[]>;

export type SavedTableView = {
  id: string;
  view_name: string;
  filters: TableFilters;
  updated_at: string;
};

/**
 * Load and save table view filter preferences per user and page.
 * Supports multiple named views: save current filters as a new view, rename, delete, apply a view.
 * The view named "default" is applied on initial load when present.
 */
export function useTablePreferences(pageKey: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["table-preferences", pageKey, user?.id ?? ""];

  const {
    data: rows = [],
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_table_preferences")
        .select("id, view_name, filters, updated_at")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedTableView[];
    },
    enabled: !!user?.id,
  });

  /** Filters from the "default" view (for initial load). */
  const defaultView = rows.find((r) => r.view_name === "default");
  const filters: TableFilters | null =
    defaultView?.filters && typeof defaultView.filters === "object" && !Array.isArray(defaultView.filters)
      ? (defaultView.filters as TableFilters)
      : null;

  const saveAsNewViewMutation = useMutation({
    mutationFn: async ({ view_name, filters: f }: { view_name: string; filters: TableFilters }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_table_preferences").insert({
        user_id: user.id,
        page_key: pageKey,
        view_name: view_name.trim() || "Untitled view",
        filters: f as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateViewMutation = useMutation({
    mutationFn: async ({
      id,
      view_name,
      filters: f,
    }: {
      id: string;
      view_name?: string;
      filters?: TableFilters;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const payload: { view_name?: string; filters?: Record<string, unknown>; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (view_name !== undefined) payload.view_name = view_name.trim() || "Untitled view";
      if (f !== undefined) payload.filters = f as Record<string, unknown>;
      const { error } = await supabase
        .from("user_table_preferences")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_table_preferences")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from("user_table_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("page_key", pageKey);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    /** Filters from the "default" view (apply on initial load). */
    filters,
    /** All saved views for this page. */
    views: rows,
    isLoading: isLoading && !!user?.id,
    saveAsNewView: saveAsNewViewMutation.mutateAsync,
    saveAsNewViewPending: saveAsNewViewMutation.isPending,
    updateView: updateViewMutation.mutateAsync,
    updateViewPending: updateViewMutation.isPending,
    deleteView: deleteViewMutation.mutateAsync,
    deleteViewPending: deleteViewMutation.isPending,
    resetToDefault: resetMutation.mutateAsync,
    resetPending: resetMutation.isPending,
  };
}

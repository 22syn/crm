import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityToolbar } from "@/components/entity-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemDialog } from "@/components/ad-agency/ItemDialog";
import { ItemFilters } from "@/components/ad-agency/ItemFilters";
import { ItemTable } from "@/components/ad-agency/ItemTable";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;

export default function AdAgencyItems() {
  const { isModuleAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OpItem | null>(null);

  const { data: sections = [] } = useQuery({
    queryKey: ["op_budget_sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_budget_sections").select("*").order("sort_order");
      if (error) return []; // table may not exist if migration not run
      return (data ?? []) as { id: string; name: string; sort_order: number }[];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["op_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_items").select("*").order("type");
      if (error) throw error;
      return data as OpItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; price: number; section_id?: string | null }) => {
      const { error } = await supabase.from("op_items").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט נוסף בהצלחה" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "שגיאה בהוספת פריט", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { type: string; price: number; section_id?: string | null } }) => {
      const { error } = await supabase.from("op_items").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט עודכן בהצלחה" });
      setDialogOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון פריט", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט נמחק בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת פריט", variant: "destructive" });
    },
  });

  const handleSave = (data: { type: string; price: number; section_id?: string | null }) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: OpItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: OpItem) => {
    if (confirm(`האם למחוק את הפריט "${item.type}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = isModuleAdmin("ad_agency");
  const hasActiveFilters = !!searchQuery.trim();
  const handleClearFilters = () => setSearchQuery("");

  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("ad-agency-items");
  const ITEM_COLUMNS = [
    { id: "section", header: "סקציה" },
    { id: "type", header: "סוג" },
    { id: "price", header: "מחיר (₪)" },
  ];

  const itemToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <ItemFilters variant="searchOnly" search={searchQuery} onSearchChange={setSearchQuery} />
      }
      renderMobileFilters={
        <ItemFilters variant="filtersOnly" search={searchQuery} onSearchChange={setSearchQuery} />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={ITEM_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
        />
      }
    >
      <ItemFilters search={searchQuery} onSearchChange={setSearchQuery} />
    </EntityToolbar>
  );

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold">פריטים</h1>
            <p className="text-muted-foreground">קטלוג פריטים – סוג ומחיר</p>
          </div>
          <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            הוסף פריט
          </Button>
        </div>

        {itemToolbar}

        <Card>
          <CardHeader>
            <CardTitle>רשימת פריטים</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו פריטים
              </div>
            ) : (
              <ItemTable
                items={filteredItems}
                sections={sections}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                visibleColumnIds={visibleColumnIds}
              />
            )}
          </CardContent>
        </Card>

        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={selectedItem}
          sections={sections}
          onSave={handleSave}
        />
    </div>
  );
}

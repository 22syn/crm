import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { DealKanban } from "@/components/deals/DealKanban";
import { DealDialog } from "@/components/deals/DealDialog";
import { DealTable } from "@/components/deals/DealTable";
import { DealFilters } from "@/components/deals/DealFilters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEntityFilters } from "@/hooks/useEntityFilters";
import type { EntityViewMode } from "@/components/entity-page";

type DealStage =
  | "quote_approved"
  | "in_production"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  lead_id: string | null;
  quote_id: string | null;
  notes: string | null;
  created_at: string;
  leads?: { customer_name: string } | null;
}

export default function Deals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<EntityViewMode>("kanban");
  const queryClient = useQueryClient();

  interface DealFiltersData {
    search: string;
    stageFilter: string;
  }

  const {
    filters,
    setFilter,
    searchInput,
    setSearchInput,
    views: savedViews,
    saveAsNewView,
    saveAsNewViewPending,
    updateView,
    deleteView,
    resetToDefault,
    resetPending,
    applyView,
    clearFilters,
  } = useEntityFilters<DealFiltersData>({
    pageKey: "deals",
    initialFilters: {
      search: "",
      stageFilter: "all",
    },
  });

  const { search, stageFilter } = filters;

  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  const handleSaveAsNewView = async () => {
    const name = newViewName.trim() || "Untitled view";
    try {
      await saveAsNewView({ view_name: name, filters: filters as Record<string, string | string[]> });
      toast.success(`View "${name}" saved`);
      setSaveViewDialogOpen(false);
      setNewViewName("");
    } catch {
      toast.error("Failed to save view");
    }
  };

  const handleRenameView = async (id: string, name: string) => {
    try {
      await updateView({ id, view_name: name.trim() || "Untitled view" });
      toast.success("View renamed");
    } catch {
      toast.error("Failed to rename view");
    }
  };

  const hasFilters = search.trim() !== "" || stageFilter !== "all";

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`*, leads(customer_name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
  });

  const filteredDeals = deals.filter((d) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.leads?.customer_name?.toLowerCase().includes(q)) return false;
    }
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Deal, "id" | "quote_id" | "leads">) => {
      const { data: result, error } = await supabase
        .from("deals")
        .insert({
          title: data.title,
          stage: data.stage as DealStage,
          amount: data.amount,
          expected_close_date: data.expected_close_date,
          probability: data.probability,
          lead_id: data.lead_id,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Error creating deal");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({
          title: data.title,
          stage: data.stage as DealStage,
          amount: data.amount,
          expected_close_date: data.expected_close_date,
          probability: data.probability,
          lead_id: data.lead_id,
          notes: data.notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal updated successfully");
      setDialogOpen(false);
      setSelectedDeal(null);
    },
    onError: () => {
      toast.error("Error updating deal");
    },
  });

  const handleStageChange = async (dealId: string, stage: DealStage) => {
    const { error } = await supabase.from("deals").update({ stage }).eq("id", dealId);

    if (error) {
      toast.error("Error updating stage");
    } else {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  };

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<Deal, "id" | "quote_id" | "leads">) => {
    if (selectedDeal) {
      updateMutation.mutate({ id: selectedDeal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setSelectedDeal(null);
  };

  const renderToolbar = (mode: EntityViewMode) =>
    (mode === "kanban" || mode === "table") ? (
      <EntityToolbar
        onSaveView={() => setSaveViewDialogOpen(true)}
        savePending={saveAsNewViewPending}
        onReset={resetToDefault}
        resetPending={resetPending}
        savedViews={savedViews}
        onApplyView={applyView as (f: Record<string, string>) => void}
        onRenameView={handleRenameView}
        onDeleteView={deleteView}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        renderMobileSearch={
          <DealFilters
            variant="searchOnly"
            search={searchInput}
            onSearchChange={setSearchInput}
            stageFilter={stageFilter}
            onStageFilterChange={(v) => setFilter("stageFilter", v)}
          />
        }
        renderMobileFilters={
          <DealFilters
            variant="filtersOnly"
            search={searchInput}
            onSearchChange={setSearchInput}
            stageFilter={stageFilter}
            onStageFilterChange={(v) => setFilter("stageFilter", v)}
          />
        }
      >
        <DealFilters
          search={searchInput}
          onSearchChange={setSearchInput}
          stageFilter={stageFilter}
          onStageFilterChange={(v) => setFilter("stageFilter", v)}
        />
      </EntityToolbar>
    ) : null;

  return (
    <EntityPageShell
      title="Deals"
      subtitle="Sales pipeline management"
      addButtonText="New Deal"
      onAddClick={() => setDialogOpen(true)}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderKanban={
        <DealKanban
          deals={filteredDeals}
          isLoading={isLoading}
          onEdit={handleEdit}
          onStageChange={handleStageChange}
        />
      }
      renderTable={
        <DealTable
          deals={filteredDeals}
          onEdit={handleEdit}
          onStageChange={(id, stage) => handleStageChange(id, stage as DealStage)}
        />
      }
      renderToolbar={renderToolbar}
    >
      <DealDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        deal={selectedDeal}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as new view</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Save current filters as a named view so you can switch back to it later.
          </p>
          <div className="grid gap-2 py-2">
            <Label htmlFor="deal-view-name">View name</Label>
            <Input
              id="deal-view-name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. Hot deals"
              onKeyDown={(e) => e.key === "Enter" && handleSaveAsNewView()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveViewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsNewView} disabled={saveAsNewViewPending}>
              {saveAsNewViewPending ? "Saving…" : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityPageShell>
  );
}

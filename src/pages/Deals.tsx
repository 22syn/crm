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
import { Plus, FilterX, RotateCcw } from "lucide-react";
import { useTablePreferences } from "@/hooks/useTablePreferences";
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
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const {
    filters: savedFilters,
    views: savedViews,
    saveAsNewView,
    saveAsNewViewPending,
    updateView,
    deleteView,
    resetToDefault,
    resetPending,
  } = useTablePreferences("deals");
  const appliedSavedRef = useRef(false);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  useEffect(() => {
    if (appliedSavedRef.current || !savedFilters) return;
    if (typeof savedFilters.search === "string") setSearch(savedFilters.search);
    if (typeof savedFilters.stageFilter === "string") setStageFilter(savedFilters.stageFilter);
    appliedSavedRef.current = true;
  }, [savedFilters]);

  const currentFilters = () => ({ search, stageFilter });

  const handleSaveAsNewView = async () => {
    const name = newViewName.trim() || "Untitled view";
    try {
      await saveAsNewView({ view_name: name, filters: currentFilters() });
      toast.success(`View "${name}" saved`);
      setSaveViewDialogOpen(false);
      setNewViewName("");
    } catch {
      toast.error("Failed to save view");
    }
  };

  const applyView = (filters: Record<string, string>) => {
    if (typeof filters.search === "string") setSearch(filters.search);
    if (typeof filters.stageFilter === "string") setStageFilter(filters.stageFilter);
  };

  const handleRenameView = async (id: string, name: string) => {
    try {
      await updateView({ id, view_name: name.trim() || "Untitled view" });
      toast.success("View renamed");
    } catch {
      toast.error("Failed to rename view");
    }
  };

  const handleResetPreferences = async () => {
    try {
      await resetToDefault();
      setSearch("");
      setStageFilter("all");
      toast.success("Filters reset to default");
    } catch {
      toast.error("Failed to reset preferences");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStageFilter("all");
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
        onReset={handleResetPreferences}
        resetPending={resetPending}
        savedViews={savedViews}
        onApplyView={applyView}
        onRenameView={handleRenameView}
        onDeleteView={deleteView}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
        renderMobileSearch={
          <DealFilters
            variant="searchOnly"
            search={search}
            onSearchChange={setSearch}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
          />
        }
        renderMobileFilters={
          <DealFilters
            variant="filtersOnly"
            search={search}
            onSearchChange={setSearch}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
          />
        }
      >
        <DealFilters
          search={search}
          onSearchChange={setSearch}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
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
      kanbanCount={filteredDeals.length}
      tableCount={filteredDeals.length}
      isLoading={isLoading}
      isEmpty={!isLoading && filteredDeals.length === 0}
      renderEmptyState={
        hasFilters ? (
          <div className="rounded-xl border border-dashed bg-muted/30 py-12 px-6 text-center">
            <FilterX className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
            <p className="font-medium text-foreground">No deals match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try clearing or resetting your filters.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <FilterX className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetPreferences} disabled={resetPending}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset to default
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 py-12 px-6 text-center">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
            <p className="font-medium text-foreground">Add your first deal</p>
            <p className="text-sm text-muted-foreground mt-1">
              Get started by creating a deal from your pipeline.
            </p>
            <Button variant="accent" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </div>
        )
      }
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

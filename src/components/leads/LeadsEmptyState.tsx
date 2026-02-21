import { Button } from "@/components/ui/button";
import { Plus, Sparkles, RotateCcw, FilterX } from "lucide-react";

/**
 * Empty state when the leads list has no results.
 * Two variants: filters active (no match) vs no filters (truly empty).
 * Used by both Pipeline (Kanban) and Table views.
 */
interface LeadsEmptyStateProps {
  /** True when search or any filter (status, source, assignee) is applied. */
  hasActiveFilters: boolean;
  /** Reset saved preferences and clear all filters. */
  onResetFilters: () => void;
  /** Clear current filters locally (no preference save). */
  onClearFilters: () => void;
  /** Open the New Lead dialog. */
  onAddFirstLead: () => void;
  /** Optional: add 50 demo leads (for demo environments). */
  onAddDemoLeads?: () => void;
  /** Loading state for add-demo-leads action. */
  addDemoLeadsPending?: boolean;
}

export function LeadsEmptyState({
  hasActiveFilters,
  onResetFilters,
  onClearFilters,
  onAddFirstLead,
  onAddDemoLeads,
  addDemoLeadsPending = false,
}: LeadsEmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <div className="rounded-sm border border-dashed bg-muted/30 py-12 px-6 text-center">
        <FilterX className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
        <p className="text-body font-medium text-foreground">No leads match your filters</p>
        <p className="text-meta text-muted-foreground mt-1">
          Try clearing or resetting your filters to see more leads.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" className="rounded-sm" onClick={onClearFilters}>
            <FilterX className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm" onClick={onResetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to default
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-dashed bg-muted/30 py-12 px-6 text-center">
      <Plus className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
      <p className="text-title font-medium text-foreground">Add your first lead</p>
      <p className="text-meta text-muted-foreground mt-1">
        Get started by creating a lead or add demo data to explore the pipeline.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <Button
          variant="accent"
          className="rounded-sm"
          size="sm"
          onClick={onAddFirstLead}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add your first lead
        </Button>
        {onAddDemoLeads && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={onAddDemoLeads}
            disabled={addDemoLeadsPending}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {addDemoLeadsPending ? "Adding…" : "Add 50 demo leads"}
          </Button>
        )}
      </div>
    </div>
  );
}

import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { LeadKanban } from "@/components/leads/LeadKanban";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadsHeaderActions } from "@/components/leads/LeadsHeaderActions";
import { LeadsEmptyState } from "@/components/leads/LeadsEmptyState";
import { LeadsTableSkeleton } from "@/components/leads/LeadsTableSkeleton";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLeads } from "@/hooks/useLeads";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function Leads() {
  const {
    dialogOpen,
    setDialogOpen,
    editingLead,
    setEditingLead,
    quoteBuilderOpen,
    setQuoteBuilderOpen,
    quoteLead,
    searchInput,
    statusFilter,
    sourceFilter,
    assigneeFilter,
    sortOption,
    setSortOption,
    saveViewDialogOpen,
    setSaveViewDialogOpen,
    newViewName,
    setNewViewName,
    page,
    setPage,
    viewMode,
    setViewMode,
    savingCell,
    selectedLeadIds,
    setSelectedLeadIds,
    previewOpen,
    setPreviewOpen,
    selectedQuote,
    quoteItems,
    PAGE_SIZE,
    totalPages,
    totalCount,
    leads,
    leadQuotes,
    isLoading,
    hasActiveFilters,
    bulkStatusOptions,
    savedViews,
    saveAsNewViewPending,
    resetPending,
    seedDemoLeadsMutation,
    handleSearchChange,
    handleStatusFilterChange,
    handleSourceFilterChange,
    handleAssigneeFilterChange,
    applyView,
    handleSaveAsNewView,
    handleRenameView,
    handleResetPreferences,
    handleClearFilters,
    handleSave,
    handleEdit,
    handleStatusChange,
    handleAssigneeChange,
    handleInlineUpdate,
    handleBulkStatusChange,
    handleBulkAssign,
    handleCreateQuote,
    handleViewQuote,
    handleUnlinkQuote,
    handleAssociateQuote,
    user,
    teamMembers,
    membersByUserId,
    navigate,
    createMutation,
    updateMutation,
    deleteView,
  } = useLeads();

  const leadsToolbar = (
    <EntityToolbar
      onSaveView={() => setSaveViewDialogOpen(true)}
      savePending={saveAsNewViewPending}
      onReset={handleResetPreferences}
      resetPending={resetPending}
      savedViews={savedViews}
      onApplyView={applyView}
      onRenameView={handleRenameView}
      onDeleteView={deleteView}
      quickViews={[
        {
          value: "my",
          label: "My pipeline",
          onSelect: () => handleAssigneeFilterChange(user?.id ?? "all"),
        },
        {
          value: "unassigned",
          label: "Unassigned",
          onSelect: () => handleAssigneeFilterChange("unassigned"),
        },
      ]}
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <LeadFilters
          variant="searchOnly"
          search={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sourceFilter={sourceFilter}
          onSourceFilterChange={handleSourceFilterChange}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={handleAssigneeFilterChange}
          teamMembers={teamMembers}
        />
      }
      renderMobileFilters={
        <LeadFilters
          variant="filtersOnly"
          search={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sourceFilter={sourceFilter}
          onSourceFilterChange={handleSourceFilterChange}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={handleAssigneeFilterChange}
          teamMembers={teamMembers}
        />
      }
    >
      <LeadFilters
        search={searchInput}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        sourceFilter={sourceFilter}
        onSourceFilterChange={handleSourceFilterChange}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={handleAssigneeFilterChange}
        teamMembers={teamMembers}
      />
    </EntityToolbar>
  );

  const openDialog = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  return (
    <EntityPageShell
      title="Leads"
      subtitle="Manage your sales pipeline"
      addButtonText="New Lead"
      onAddClick={openDialog}
      headerActions={
        <LeadsHeaderActions
          onAddDemoLeads={() => seedDemoLeadsMutation.mutate()}
          isPending={seedDemoLeadsMutation.isPending}
        />
      }
      viewMode={viewMode}
      onViewModeChange={(v) => v && setViewMode(v as "kanban" | "table")}
      renderToolbar={() => leadsToolbar}
      renderKanban={
        <>
          {!isLoading && leads.length === 0 ? (
            <LeadsEmptyState
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetPreferences}
              onClearFilters={handleClearFilters}
              onAddFirstLead={openDialog}
              onAddDemoLeads={() => seedDemoLeadsMutation.mutate()}
              addDemoLeadsPending={seedDemoLeadsMutation.isPending}
            />
          ) : (
            <LeadKanban
              leads={leads}
              membersByUserId={membersByUserId}
              isLoading={isLoading}
              onEdit={handleEdit}
              onViewLead={(l: Lead) => navigate(`/leads/${l.id}`)}
              onStatusChange={handleStatusChange}
              onCreateQuote={handleCreateQuote}
              leadQuotes={leadQuotes}
              onViewQuote={handleViewQuote}
              onUnlinkQuote={handleUnlinkQuote}
              selectedStatuses={statusFilter.length > 0 ? statusFilter : undefined}
              sortOption={sortOption}
              onSortOptionChange={(v) => setSortOption(v)}
            />
          )}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-section">
              <div className="text-meta text-muted-foreground shrink-0">
                Showing {Math.min(page * PAGE_SIZE + 1, totalCount)} to{" "}
                {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                leads
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      }
      renderTable={
        <>
          {isLoading && leads.length === 0 ? (
            <LeadsTableSkeleton />
          ) : !isLoading && leads.length === 0 ? (
            <LeadsEmptyState
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetPreferences}
              onClearFilters={handleClearFilters}
              onAddFirstLead={openDialog}
              onAddDemoLeads={() => seedDemoLeadsMutation.mutate()}
              addDemoLeadsPending={seedDemoLeadsMutation.isPending}
            />
          ) : (
            <>
              {selectedLeadIds.size > 0 && (
                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 sm:gap-3 rounded-sm border bg-card px-3 sm:px-4 py-2 mb-4 shadow-sm">
                  <span className="text-body font-medium shrink-0">
                    {selectedLeadIds.size} selected
                  </span>
                  <Select
                    onValueChange={(v) =>
                      handleBulkStatusChange(v as Lead["status"])
                    }
                  >
                    <SelectTrigger className="min-w-[120px] sm:w-[200px] h-8 shrink-0">
                      <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(v) =>
                      handleBulkAssign(v === "unassigned" ? null : v)
                    }
                  >
                    <SelectTrigger className="min-w-[120px] sm:w-[200px] h-8 shrink-0">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name || m.email || m.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLeadIds(new Set())}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear selection
                  </Button>
                </div>
              )}
              <LeadTable
                leads={leads}
                membersByUserId={membersByUserId}
                onEdit={handleEdit}
                onViewLead={(l: Lead) => navigate(`/leads/${l.id}`)}
                onStatusChange={handleStatusChange}
                onAssigneeChange={handleAssigneeChange}
                onInlineUpdate={handleInlineUpdate}
                savingCell={savingCell}
                selectedLeadIds={selectedLeadIds}
                onSelectionChange={setSelectedLeadIds}
                onCreateQuote={handleCreateQuote}
                leadQuotes={leadQuotes}
                onViewQuote={handleViewQuote}
                onUnlinkQuote={handleUnlinkQuote}
                sortOption={sortOption}
                onSortOptionChange={(v) => setSortOption(v)}
              />
            </>
          )}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-section">
              <div className="text-meta text-muted-foreground shrink-0">
                Showing {Math.min(page * PAGE_SIZE + 1, totalCount)} to{" "}
                {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                leads
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      }
    >
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        teamMembers={teamMembers}
        onCreateQuote={handleCreateQuote}
        onViewQuote={handleViewQuote}
        onUnlinkQuote={handleUnlinkQuote}
        onAssociateQuote={handleAssociateQuote}
        onViewExistingLead={(leadId) => {
          setDialogOpen(false);
          setEditingLead(null);
          navigate("/leads", { state: { openLeadId: leadId } });
        }}
        onViewLead={(leadId) => {
          setDialogOpen(false);
          setEditingLead(null);
          navigate(`/leads/${leadId}`);
        }}
      />

      <QuoteBuilder
        open={quoteBuilderOpen}
        onOpenChange={setQuoteBuilderOpen}
        lead={quoteLead}
      />

      {selectedQuote && (
        <QuotePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          customerName={selectedQuote.customer_name}
          customerAddress={selectedQuote.customer_address ?? undefined}
          quoteNumber={selectedQuote.quote_number}
          quoteDate={
            selectedQuote.created_at
              ? new Date(selectedQuote.created_at)
              : undefined
          }
          items={quoteItems}
          subtotal={selectedQuote.subtotal}
          discount={selectedQuote.discount || 0}
          tax={selectedQuote.tax || 0}
          total={selectedQuote.total}
          validUntil={
            selectedQuote.valid_until
              ? new Date(selectedQuote.valid_until)
              : undefined
          }
          notes={selectedQuote.notes}
        />
      )}

      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as new view</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Save current filters as a named view so you can switch back to it
            later.
          </p>
          <div className="grid gap-2 py-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. My pipeline"
              onKeyDown={(e) => e.key === "Enter" && handleSaveAsNewView()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveViewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsNewView}
              disabled={saveAsNewViewPending}
            >
              {saveAsNewViewPending ? "Saving…" : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityPageShell>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { QuoteKanban } from "@/components/quotes/QuoteKanban";
import { QuoteFilters } from "@/components/quotes/QuoteFilters";
import { QuoteTable } from "@/components/quotes/QuoteTable";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Quotes() {
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: archivedQuotes = [] } = useQuery({
    queryKey: ["archived-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-archive unlinked quotes older than 14 days
  const archiveOldQuotesMutation = useMutation({
    mutationFn: async () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { error } = await supabase
        .from("quotes")
        .update({ archived_at: new Date().toISOString() })
        .is("lead_id", null)
        .not("unlinked_at", "is", null)
        .lt("unlinked_at", fourteenDaysAgo.toISOString())
        .is("archived_at", null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["archived-quotes"] });
    },
  });

  // Run auto-archive on mount
  useEffect(() => {
    archiveOldQuotesMutation.mutate();
  }, []);

  const approveQuoteMutation = useMutation({
    mutationFn: async (quote: any) => {
      // Update quote status to approved
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "approved" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      // If quote has a project (ad-agency), update project and skip lead/deal logic
      if (quote.project_id) {
        const { error: projectError } = await supabase
          .from("op_projects")
          .update({ status: "planning", budget_approved: quote.total })
          .eq("id", quote.project_id);
        if (projectError) throw projectError;
        return { type: "project" };
      }

      // If quote has a lead, convert lead to customer
      let customerId = null;
      if (quote.lead_id) {
        // Get the lead details
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", quote.lead_id)
          .single();

        if (leadError) throw leadError;

        // Check if lead is already converted
        if (!lead.converted_customer_id) {
          // Create customer from lead info
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .insert({
              name: lead.customer_name,
              email: lead.customer_email,
              phone: lead.customer_phone,
              address: lead.customer_address,
              notes: lead.notes,
            })
            .select()
            .single();

          if (customerError) throw customerError;

          customerId = customer.id;

          // Update lead with converted customer id and status to done
          const { error: updateLeadError } = await supabase
            .from("leads")
            .update({ 
              converted_customer_id: customer.id,
              status: "done"
            })
            .eq("id", quote.lead_id);

          if (updateLeadError) throw updateLeadError;
        } else {
          customerId = lead.converted_customer_id;
        }
      }

      // Get quote items that require custom design
      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quote.id)
        .eq("requires_custom_design", true);

      if (itemsError) throw itemsError;

      // Create design requests for items that need custom design
      if (items && items.length > 0) {
        const designRequests = items.map((item: any) => ({
          quote_id: quote.id,
          quote_item_id: item.id,
          customer_notes: item.custom_design_notes,
          status: "pending",
        }));

        const { error: designError } = await supabase
          .from("design_requests")
          .insert(designRequests);

        if (designError) throw designError;

        return { quote, designRequestsCreated: items.length, customerId };
      }

      return { quote, designRequestsCreated: 0, customerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["op_projects"] });

      if (result?.type === "project") {
        toast.success("ההצעה אושרה והפרויקט עודכן");
        return;
      }

      let message = "Contract approved successfully";
      if (result.customerId) {
        message += " - Customer created";
      }
      if (result.designRequestsCreated > 0) {
        message += ` - ${result.designRequestsCreated} design request(s) created`;
      }
      toast.success(message);
    },
    onError: (error) => {
      toast.error("Error approving contract: " + error.message);
    },
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      const { error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["archived-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quotes"] });
      toast.success("Contract updated");
    },
    onError: (error) => {
      toast.error("Error updating contract: " + error.message);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      // First delete quote items
      const { error: itemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);
      
      if (itemsError) throw itemsError;

      // Then delete the quote
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["archived-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quotes"] });
      toast.success("Contract deleted successfully");
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    },
    onError: (error) => {
      toast.error("Error deleting contract: " + error.message);
    },
  });

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  const allQuotesForFilters = [...quotes, ...archivedQuotes];
  const yearOptions = [...new Set(allQuotesForFilters.map((q: any) => {
    const d = q.created_at || q.archived_at;
    return d ? new Date(d).getFullYear().toString() : null;
  }).filter(Boolean))].sort((a, b) => (b as string).localeCompare(a as string)).map((y) => ({ value: y as string, label: y as string }));
  const clientOptions = [...new Set(allQuotesForFilters.map((q: any) => (q.customer_name || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((c) => ({ value: c, label: c }));

  const getFilteredQuotes = () => {
    let list: any[];
    if (statusFilter === "all") list = quotes;
    else if (statusFilter === "draft") list = draftQuotes;
    else if (statusFilter === "sent") list = sentQuotes;
    else if (statusFilter === "approved") list = approvedQuotes;
    else list = archivedQuotes;

    if (yearFilter !== "all") {
      list = list.filter((x: any) => {
        const d = x.created_at || x.archived_at;
        return d && new Date(d).getFullYear().toString() === yearFilter;
      });
    }
    if (clientFilter !== "all") {
      list = list.filter((x: any) => (x.customer_name || "").trim() === clientFilter);
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (x: any) =>
        (x.customer_name || "").toLowerCase().includes(q) ||
        (x.quote_number || "").toLowerCase().includes(q)
    );
  };

  const getTableHandlers = () => {
    const base = { onView: handleViewQuote, onDelete: handleDeleteQuote };
    if (statusFilter === "all") return { ...base, onEdit: handleEditQuote, onApprove: handleApproveQuote };
    if (statusFilter === "sent") return { ...base, onEdit: handleEditQuote, onApprove: handleApproveQuote };
    if (statusFilter === "draft") return { ...base, onEdit: handleEditQuote };
    return base;
  };

  const draftQuotes = quotes.filter(q => q.status === "draft");
  const sentQuotes = quotes.filter(q => q.status === "sent");
  const approvedQuotes = quotes.filter(q => q.status === "approved");

  const handleViewQuote = async (quote: any) => {
    setSelectedQuote(quote);
    
    // Fetch quote items
    const { data: items } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id);
    
    setQuoteItems(items || []);
    setPreviewOpen(true);
  };

  const handleApproveQuote = (quote: any) => {
    approveQuoteMutation.mutate(quote);
  };

  const handleEditQuote = async (quote: any) => {
    // Show the quote preview - full edit requires more changes
    handleViewQuote(quote);
  };

  const handleDeleteQuote = (quote: any) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const handleQuoteStatusChange = (quoteId: string, newStatus: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    if (newStatus === "approved") {
      handleApproveQuote(quote);
    } else {
      updateQuoteStatusMutation.mutate({ quoteId, status: newStatus });
    }
  };

  const confirmDelete = () => {
    if (quoteToDelete) {
      deleteQuoteMutation.mutate(quoteToDelete.id);
    }
  };

  if (quotes.length === 0 && archivedQuotes.length === 0 && !isLoading) {
    return (
      <EntityPageShell
        title="Contracts"
        subtitle="Manage and create customer contracts"
        addButtonText="New Contract"
        onAddClick={() => setBuilderOpen(true)}
        viewMode="kanban"
        onViewModeChange={() => {}}
        renderKanban={null}
        renderTable={null}
        isEmpty
        renderEmptyState={
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Contracts</h3>
            <p className="text-muted-foreground mt-1">Create your first contract</p>
            <Button className="mt-4" onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <EntityPageShell
      title="Contracts"
      subtitle="Manage and create customer contracts"
      addButtonText="New Contract"
      onAddClick={() => setBuilderOpen(true)}
      viewMode={viewMode}
      onViewModeChange={(m) => m !== "report" && setViewMode(m)}
      renderKanban={
        <QuoteKanban
          quotes={getFilteredQuotes()}
          isLoading={isLoading}
          onView={handleViewQuote}
          onEdit={handleEditQuote}
          onStatusChange={handleQuoteStatusChange}
        />
      }
      renderTable={
        <QuoteTable
          quotes={getFilteredQuotes()}
          onView={handleViewQuote}
          onEdit={getTableHandlers().onEdit}
          onApprove={getTableHandlers().onApprove}
          onDelete={handleDeleteQuote}
        />
      }
      renderToolbar={() => (
        <EntityToolbar
          renderMobileSearch={
            <QuoteFilters
              variant="searchOnly"
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              yearOptions={yearOptions}
              clientFilter={clientFilter}
              onClientFilterChange={setClientFilter}
              clientOptions={clientOptions}
              archivedCount={archivedQuotes.length}
            />
          }
          renderMobileFilters={
            <QuoteFilters
              variant="filtersOnly"
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              yearOptions={yearOptions}
              clientFilter={clientFilter}
              onClientFilterChange={setClientFilter}
              clientOptions={clientOptions}
              archivedCount={archivedQuotes.length}
            />
          }
        >
          <QuoteFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            yearOptions={yearOptions}
            clientFilter={clientFilter}
            onClientFilterChange={setClientFilter}
            clientOptions={clientOptions}
            archivedCount={archivedQuotes.length}
          />
        </EntityToolbar>
      )}
    >
      <QuoteBuilder open={builderOpen} onOpenChange={setBuilderOpen} />

      {selectedQuote && (
        <QuotePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          customerName={selectedQuote.customer_name}
          customerAddress={selectedQuote.customer_address ?? undefined}
          quoteNumber={selectedQuote.quote_number}
          quoteDate={selectedQuote.created_at ? new Date(selectedQuote.created_at) : undefined}
          items={quoteItems}
          subtotal={selectedQuote.subtotal}
          discount={selectedQuote.discount || 0}
          tax={selectedQuote.tax || 0}
          total={selectedQuote.total}
          validUntil={selectedQuote.valid_until ? new Date(selectedQuote.valid_until) : undefined}
          notes={selectedQuote.notes}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract {quoteToDelete?.quote_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EntityPageShell>
  );
}

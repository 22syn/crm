import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadKanban } from "@/components/leads/LeadKanban";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

export default function Leads() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);
  const [quoteLead, setQuoteLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { error } = await supabase.from("leads").insert(lead);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created successfully");
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create lead: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase.from("leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated successfully");
      setDialogOpen(false);
      setEditingLead(null);
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });

  const handleSave = (data: LeadInsert) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleStatusChange = (leadId: string, newStatus: Lead["status"]) => {
    updateMutation.mutate({ id: leadId, status: newStatus });
  };

  const handleCreateQuote = (lead: Lead) => {
    setQuoteLead(lead);
    setQuoteBuilderOpen(true);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        lead.customer_name.toLowerCase().includes(searchLower) ||
        lead.customer_email?.toLowerCase().includes(searchLower) ||
        lead.customer_phone?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Manage your sales pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "kanban" | "table")}>
              <ToggleGroupItem value="kanban" aria-label="Kanban view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => { setEditingLead(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </div>

        <LeadFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
        />

        {viewMode === "kanban" ? (
          <LeadKanban
            leads={filteredLeads}
            isLoading={isLoading}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            onCreateQuote={handleCreateQuote}
          />
        ) : (
          <LeadTable
            leads={filteredLeads}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            onCreateQuote={handleCreateQuote}
          />
        )}

        <LeadDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          lead={editingLead}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <QuoteBuilder 
          open={quoteBuilderOpen} 
          onOpenChange={setQuoteBuilderOpen} 
          lead={quoteLead}
        />
      </div>
    </DashboardLayout>
  );
}

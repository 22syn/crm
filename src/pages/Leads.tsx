import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { LeadKanban } from "@/components/leads/LeadKanban";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadFilters } from "@/components/leads/LeadFilters";
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
import { Plus, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useEntityFilters } from "@/hooks/useEntityFilters";
import { LEAD_STAGES } from "@/utils/leadStages";
import {
  SORT_OPTIONS,
  type SortOption,
} from "@/utils/leadSort";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStatus = Lead["status"];
type LeadSource = Lead["source"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const DEMO_LEADS: { customer_name: string; customer_phone: string; customer_email?: string; source: LeadSource; status: LeadStatus }[] = [
  { customer_name: "Yael Cohen", customer_phone: "+972-50-111-2233", customer_email: "yael.c@example.com", source: "instagram", status: "new" },
  { customer_name: "David Levi", customer_phone: "+972-52-222-3344", customer_email: "d.levi@example.com", source: "website", status: "new" },
  { customer_name: "Sarah Mizrahi", customer_phone: "+972-54-333-4455", source: "architects", status: "new" },
  { customer_name: "Michael Ben-David", customer_phone: "+972-50-444-5566", customer_email: "michael.bd@example.com", source: "organic", status: "new" },
  { customer_name: "Rachel Avraham", customer_phone: "+972-52-555-6677", source: "facebook", status: "new" },
  { customer_name: "Jonathan Shapira", customer_phone: "+972-54-666-7788", customer_email: "j.shapira@example.com", source: "instagram", status: "new" },
  { customer_name: "Noa Goldstein", customer_phone: "+972-50-777-8899", source: "website", status: "new" },
  { customer_name: "Eitan Friedman", customer_phone: "+972-52-888-9900", customer_email: "eitan.f@example.com", source: "architects", status: "new" },
  { customer_name: "Maya Rosen", customer_phone: "+972-54-999-0011", source: "organic", status: "new" },
  { customer_name: "Oren Baruch", customer_phone: "+972-50-100-2234", customer_email: "oren.b@example.com", source: "facebook", status: "new" },
  { customer_name: "Tamar Dahan", customer_phone: "+972-52-201-3345", source: "instagram", status: "new" },
  { customer_name: "Itamar Golan", customer_phone: "+972-54-302-4456", customer_email: "itamar.g@example.com", source: "website", status: "new" },
  { customer_name: "Lior Peretz", customer_phone: "+972-50-403-5567", source: "architects", status: "in_process" },
  { customer_name: "Shira Kaufman", customer_phone: "+972-52-504-6678", customer_email: "shira.k@example.com", source: "organic", status: "in_process" },
  { customer_name: "Nir Azoulay", customer_phone: "+972-54-605-7789", source: "facebook", status: "in_process" },
  { customer_name: "Hila Barkan", customer_phone: "+972-50-706-8890", customer_email: "hila.b@example.com", source: "instagram", status: "in_process" },
  { customer_name: "Guy Meir", customer_phone: "+972-52-807-9901", source: "website", status: "in_process" },
  { customer_name: "Roni Adler", customer_phone: "+972-54-908-0012", customer_email: "roni.a@example.com", source: "architects", status: "in_process" },
  { customer_name: "Tal Carmi", customer_phone: "+972-50-009-1123", source: "organic", status: "in_process" },
  { customer_name: "Yoni Segal", customer_phone: "+972-52-110-2234", customer_email: "yoni.s@example.com", source: "facebook", status: "in_process" },
  { customer_name: "Dana Weiss", customer_phone: "+972-54-211-3345", source: "instagram", status: "in_process" },
  { customer_name: "Amir Biton", customer_phone: "+972-50-312-4456", customer_email: "amir.b@example.com", source: "website", status: "in_process" },
  { customer_name: "Keren Haim", customer_phone: "+972-52-413-5567", source: "architects", status: "in_process" },
  { customer_name: "Roi Ashkenazi", customer_phone: "+972-54-514-6678", customer_email: "roi.a@example.com", source: "organic", status: "in_process" },
  { customer_name: "Eden Shalom", customer_phone: "+972-50-615-7789", source: "facebook", status: "meeting_scheduled" },
  { customer_name: "Ido Malka", customer_phone: "+972-52-716-8890", customer_email: "ido.m@example.com", source: "instagram", status: "meeting_scheduled" },
  { customer_name: "Lihi Brody", customer_phone: "+972-54-817-9901", source: "website", status: "meeting_scheduled" },
  { customer_name: "Yuval Gabbay", customer_phone: "+972-50-918-0012", customer_email: "yuval.g@example.com", source: "architects", status: "meeting_scheduled" },
  { customer_name: "Noga Stern", customer_phone: "+972-52-019-1123", source: "organic", status: "meeting_scheduled" },
  { customer_name: "Erez Cohen", customer_phone: "+972-54-120-2234", customer_email: "erez.c@example.com", source: "facebook", status: "meeting_scheduled" },
  { customer_name: "Michal Dor", customer_phone: "+972-50-221-3345", source: "instagram", status: "meeting_scheduled" },
  { customer_name: "Aviad Zohar", customer_phone: "+972-52-322-4456", customer_email: "aviad.z@example.com", source: "website", status: "meeting_scheduled" },
  { customer_name: "Shani Reuven", customer_phone: "+972-54-423-5567", source: "architects", status: "meeting_done" },
  { customer_name: "Barak Erez", customer_phone: "+972-50-524-6678", customer_email: "barak.e@example.com", source: "organic", status: "meeting_done" },
  { customer_name: "Galit Ohayon", customer_phone: "+972-52-625-7789", source: "facebook", status: "meeting_done" },
  { customer_name: "Danielle Ben-Ami", customer_phone: "+972-54-726-8890", customer_email: "danielle.ba@example.com", source: "instagram", status: "meeting_done" },
  { customer_name: "Omer Tal", customer_phone: "+972-50-827-9901", source: "website", status: "meeting_done" },
  { customer_name: "Adi Cohen", customer_phone: "+972-52-928-0012", customer_email: "adi.c@example.com", source: "architects", status: "waiting_for_approval" },
  { customer_name: "Ran Levi", customer_phone: "+972-54-029-1123", source: "organic", status: "waiting_for_approval" },
  { customer_name: "Mor Dror", customer_phone: "+972-50-130-2234", customer_email: "mor.d@example.com", source: "facebook", status: "waiting_for_approval" },
  { customer_name: "Shaked Ben-David", customer_phone: "+972-52-241-3345", source: "instagram", status: "waiting_for_approval" },
  { customer_name: "Tom Gefen", customer_phone: "+972-54-352-4456", customer_email: "tom.g@example.com", source: "website", status: "waiting_for_approval" },
  { customer_name: "Liat Harari", customer_phone: "+972-50-463-5567", customer_email: "liat.h@example.com", source: "architects", status: "done" },
  { customer_name: "Gilad Katz", customer_phone: "+972-52-574-6678", source: "organic", status: "done" },
  { customer_name: "Rivka Abramov", customer_phone: "+972-54-685-7789", customer_email: "rivka.a@example.com", source: "facebook", status: "done" },
  { customer_name: "Asaf Rubin", customer_phone: "+972-50-796-8890", source: "instagram", status: "done" },
  { customer_name: "Tali Gross", customer_phone: "+972-52-807-9901", customer_email: "tali.g@example.com", source: "website", status: "done" },
  { customer_name: "Uri Shalev", customer_phone: "+972-54-918-0012", source: "architects", status: "not_done" },
  { customer_name: "Neta Ben-Shalom", customer_phone: "+972-50-029-1123", customer_email: "neta.bs@example.com", source: "organic", status: "not_done" },
  { customer_name: "Eyal Maman", customer_phone: "+972-52-130-2234", source: "facebook", status: "not_done" },
  { customer_name: "Inbar Sade", customer_phone: "+972-54-241-3345", customer_email: "inbar.s@example.com", source: "instagram", status: "not_done" },
  { customer_name: "Yogev Dagan", customer_phone: "+972-50-352-4456", source: "website", status: "not_done" },
];

export default function Leads() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);
  const [quoteLead, setQuoteLead] = useState<Lead | null>(null);

  const [sortOption, setSortOption] = useState<SortOption>("created_at_asc");
  const [page, setPage] = useState(0);

  interface LeadFiltersData {
    search: string;
    statusFilter: string[];
    sourceFilter: string;
    assigneeFilter: string;
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
  } = useEntityFilters<LeadFiltersData>({
    pageKey: "leads",
    initialFilters: {
      search: "",
      statusFilter: [],
      sourceFilter: "all",
      assigneeFilter: "all",
    },
    onFiltersChange: () => setPage(0),
    normalizeFilters: (f) => ({
      search: typeof f.search === "string" ? f.search : "",
      statusFilter: Array.isArray(f.statusFilter)
        ? f.statusFilter
        : typeof f.statusFilter === "string" && f.statusFilter !== "all"
          ? [f.statusFilter]
          : [],
      sourceFilter: typeof f.sourceFilter === "string" ? f.sourceFilter : "all",
      assigneeFilter: typeof f.assigneeFilter === "string" ? f.assigneeFilter : "all",
    }),
  });

  const { search, statusFilter, sourceFilter, assigneeFilter } = filters;

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

  /** True when any filter is applied (used for empty-state copy and actions). */
  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter.length > 0 ||
    sourceFilter !== "all" ||
    assigneeFilter !== "all";

  // Pagination State
  const PAGE_SIZE = 50;

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [savingCell, setSavingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<Database["public"]["Tables"]["quote_items"]["Row"][]>([]);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Apply URL filters on mount (from dashboard drill-down)
  useEffect(() => {
    const noMeeting = searchParams.get("noMeeting") === "1";
    const urlStatus = searchParams.get("status");
    const urlAssignee = searchParams.get("assignee");
    if (noMeeting) {
      setFilter("statusFilter", []);
      setFilter("sourceFilter", "all");
      setFilter("assigneeFilter", "all");
    } else {
      if (urlStatus && ["new", "in_process", "meeting_scheduled", "meeting_done", "waiting_for_approval", "done", "not_done"].includes(urlStatus)) {
        setFilter("statusFilter", [urlStatus]);
      }
      if (urlAssignee) {
        setFilter("assigneeFilter", urlAssignee === "unassigned" ? "unassigned" : urlAssignee);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount for URL params

  const noMeetingFilter = searchParams.get("noMeeting") === "1";

  // Open lead from global command palette (navigate with state.openLeadId)
  // Open new lead dialog from FAB or command palette (state.openNewLead)
  useEffect(() => {
    const state = location.state as { openLeadId?: string; openNewLead?: boolean } | null;
    if (state?.openNewLead) {
      navigate(location.pathname, { replace: true, state: {} });
      setEditingLead(null);
      setDialogOpen(true);
      return;
    }
    const openLeadId = state?.openLeadId;
    if (!openLeadId) return;
    navigate(location.pathname, { replace: true, state: {} });
    const fromList = leads.find((l) => l.id === openLeadId);
    if (fromList) {
      setEditingLead(fromList);
      setDialogOpen(true);
      return;
    }
    supabase
      .from("leads")
      .select("*")
      .eq("id", openLeadId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setEditingLead(data as Lead);
          setDialogOpen(true);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when openLeadId appears in location.state
  }, [location.state]);

  // Search input updates immediately; debounce effect above applies search to query and resets page.
  const handleSearchChange = (val: string) => setSearchInput(val);
  const handleStatusFilterChange = (vals: string[]) => setFilter("statusFilter", vals);
  const handleSourceFilterChange = (val: string) => setFilter("sourceFilter", val);
  const handleAssigneeFilterChange = (val: string) => setFilter("assigneeFilter", val);

  const { user } = useAuth();
  const { data: teamMembers = [] } = useCrmTeam();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["leads", page, search, statusFilter, sourceFilter, assigneeFilter, noMeetingFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      }
      if (noMeetingFilter) {
        // Leads without meeting scheduled (active statuses only)
        query = query
          .is("meeting_date", null)
          .in("status", ["new", "in_process"]);
      } else if (statusFilter.length > 0) {
        query = query.in("status", statusFilter as Lead["status"][]);
      }
      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter as Lead["source"]);
      }
      if (assigneeFilter === "unassigned") {
        query = query.is("assigned_to", null);
      } else if (assigneeFilter !== "all") {
        query = query.eq("assigned_to", assigneeFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data as Lead[],
        count: count || 0
      };
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  const leads = leadsData?.data || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch quotes ONLY for the currently visible leads to save bandwidth
  const leadIds = leads.map(l => l.id);
  const { data: leadQuotes = {} } = useQuery({
    queryKey: ["lead-quotes", leadIds.join(",")], // Dependent on visible leads
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .in("lead_id", leadIds)
        .is("archived_at", null);

      if (error) throw error;

      // Create a map of lead_id -> quote
      const quotesMap: Record<string, Quote> = {};
      data?.forEach((quote) => {
        if (quote.lead_id) {
          quotesMap[quote.lead_id] = quote;
        }
      });
      return quotesMap;
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

  const seedDemoLeadsMutation = useMutation({
    mutationFn: async () => {
      const inserts: LeadInsert[] = DEMO_LEADS.map((demo) => ({
        customer_name: demo.customer_name,
        customer_phone: demo.customer_phone,
        customer_email: demo.customer_email ?? null,
        source: demo.source,
        status: demo.status,
      }));
      const { error } = await supabase.from("leads").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Added ${DEMO_LEADS.length} demo leads to the board`);
    },
    onError: (error) => {
      toast.error("Failed to add demo leads: " + (error as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (variables: Partial<Lead> & { id: string; inline?: boolean }) => {
      const { id, inline: _inline, ...payload } = variables;
      const { error } = await supabase.from("leads").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (variables.inline) {
        setSavingCell(null);
        toast.success("Saved");
      } else {
        setDialogOpen(false);
        setEditingLead(null);
        toast.success("Lead updated successfully");
      }
    },
    onError: (error) => {
      setSavingCell(null);
      toast.error("Failed to update lead: " + error.message);
    },
  });

  const unlinkQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from("quotes")
        .update({ lead_id: null, unlinked_at: new Date().toISOString() })
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Contract unlinked from lead");
    },
    onError: (error) => {
      toast.error("Failed to unlink contract: " + error.message);
    },
  });

  const associateQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, leadId }: { quoteId: string; leadId: string }) => {
      const { error } = await supabase
        .from("quotes")
        .update({ lead_id: leadId, unlinked_at: null })
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Contract associated with lead");
    },
    onError: (error) => {
      toast.error("Failed to associate contract: " + error.message);
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

  const handleAssigneeChange = (leadId: string, userId: string | null) => {
    setSavingCell({ leadId, field: "assigned_to" });
    updateMutation.mutate({
      id: leadId,
      assigned_to: userId,
      inline: true,
    } as Partial<Lead> & { id: string; inline: boolean });
  };

  const handleInlineUpdate = (leadId: string, field: keyof Lead, value: string | null) => {
    setSavingCell({ leadId, field });
    updateMutation.mutate({ id: leadId, [field]: value ?? undefined, inline: true } as Partial<Lead> & { id: string; inline: boolean });
  };

  const handleBulkStatusChange = async (newStatus: Lead["status"]) => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .in("id", ids);
    if (error) {
      toast.error("Failed to update leads: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    setSelectedLeadIds(new Set());
    toast.success(`Updated ${ids.length} lead(s) to ${newStatus}`);
  };

  const handleBulkAssign = async (userId: string | null) => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: userId })
      .in("id", ids);
    if (error) {
      toast.error("Failed to assign leads: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    setSelectedLeadIds(new Set());
    toast.success(`Assigned ${ids.length} lead(s)`);
  };

  const bulkStatusOptions = LEAD_STAGES.map((s) => ({ value: s.value, label: s.label }));

  const handleCreateQuote = (lead: Lead) => {
    setQuoteLead(lead);
    setQuoteBuilderOpen(true);
  };

  const handleViewQuote = async (leadId: string) => {
    const quote = leadQuotes[leadId];
    if (quote) {
      setSelectedQuote(quote);

      // Fetch quote items
      const { data: items } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quote.id);

      setQuoteItems(items || []);
      setPreviewOpen(true);
    }
  };

  const handleUnlinkQuote = (leadId: string) => {
    const quote = leadQuotes[leadId];
    if (quote) {
      unlinkQuoteMutation.mutate(quote.id);
    }
  };

  const handleAssociateQuote = (quoteId: string, leadId: string) => {
    associateQuoteMutation.mutate({ quoteId, leadId });
  };

  const sortSelect = (
    <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
      <SelectTrigger className="min-w-[140px] sm:w-[220px] h-9 rounded-md shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const leadsToolbar = (
    <EntityToolbar
      onSaveView={() => setSaveViewDialogOpen(true)}
      savePending={saveAsNewViewPending}
      onReset={resetToDefault}
      resetPending={resetPending}
      savedViews={savedViews}
      onApplyView={applyView as (f: Record<string, string>) => void}
      onRenameView={handleRenameView}
      onDeleteView={deleteView}
      quickViews={[
        { value: "my", label: "My pipeline", onSelect: () => handleAssigneeFilterChange(user?.id ?? "all") },
        { value: "unassigned", label: "Unassigned", onSelect: () => handleAssigneeFilterChange("unassigned") },
      ]}
      renderSort={sortSelect}
      hasFilters={hasActiveFilters}
      onClearFilters={clearFilters}
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

  return (
    <EntityPageShell
      title="Leads"
      subtitle="Manage your sales pipeline"
      addButtonText="New Lead"
      onAddClick={() => { setEditingLead(null); setDialogOpen(true); }}
      headerActions={
        <Button
          variant="outline"
          className="rounded-sm shrink-0 text-sm"
          onClick={() => seedDemoLeadsMutation.mutate()}
          disabled={seedDemoLeadsMutation.isPending}
        >
          <Sparkles className="h-4 w-4 mr-2 shrink-0" />
          <span className="hidden sm:inline">{seedDemoLeadsMutation.isPending ? "Adding…" : "Add 50 demo leads"}</span>
          <span className="sm:hidden">{seedDemoLeadsMutation.isPending ? "…" : "Demo"}</span>
        </Button>
      }
      viewMode={viewMode}
      onViewModeChange={(v) => v && setViewMode(v as "kanban" | "table")}
      renderToolbar={() => leadsToolbar}
      renderKanban={
        <>
              {!isLoading && leads.length === 0 ? (
                <LeadsEmptyState
                  hasActiveFilters={hasActiveFilters}
                  onResetFilters={resetToDefault}
                  onClearFilters={clearFilters}
                  onAddFirstLead={() => { setEditingLead(null); setDialogOpen(true); }}
                  onAddDemoLeads={() => seedDemoLeadsMutation.mutate()}
                  addDemoLeadsPending={seedDemoLeadsMutation.isPending}
                />
              ) : (
                <LeadKanban
                  leads={leads}
                  teamMembers={teamMembers}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onViewLead={(l) => navigate(`/leads/${l.id}`)}
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
                Showing {Math.min((page * PAGE_SIZE) + 1, totalCount)} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} leads
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isLoading}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1 || isLoading}>
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
                  onResetFilters={resetToDefault}
                  onClearFilters={clearFilters}
                  onAddFirstLead={() => { setEditingLead(null); setDialogOpen(true); }}
                  onAddDemoLeads={() => seedDemoLeadsMutation.mutate()}
                  addDemoLeadsPending={seedDemoLeadsMutation.isPending}
                />
              ) : (
                <>
                  {selectedLeadIds.size > 0 && (
                    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 sm:gap-3 rounded-sm border bg-card px-3 sm:px-4 py-2 mb-4 shadow-sm">
                      <span className="text-body font-medium shrink-0">{selectedLeadIds.size} selected</span>
                      <Select onValueChange={(v) => handleBulkStatusChange(v as Lead["status"])}>
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
                      <Select onValueChange={(v) => handleBulkAssign(v === "unassigned" ? null : v)}>
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLeadIds(new Set())}>
                        <X className="h-4 w-4 mr-1" />
                        Clear selection
                      </Button>
                    </div>
                  )}
                  <LeadTable
                    leads={leads}
                    teamMembers={teamMembers}
                    onEdit={handleEdit}
                    onViewLead={(l) => navigate(`/leads/${l.id}`)}
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
                Showing {Math.min((page * PAGE_SIZE) + 1, totalCount)} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} leads
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isLoading}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1 || isLoading}>
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
            quoteNumber={selectedQuote.quote_number}
            items={quoteItems}
            subtotal={selectedQuote.subtotal}
            discount={selectedQuote.discount || 0}
            tax={selectedQuote.tax || 0}
            total={selectedQuote.total}
            validUntil={selectedQuote.valid_until ? new Date(selectedQuote.valid_until) : undefined}
            notes={selectedQuote.notes}
          />
        )}

        <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save as new view</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Save current filters as a named view so you can switch back to it later.
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

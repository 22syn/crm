import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database, Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { escapeIlike } from "@/lib/escapeIlike";
import { quotesByLeadId } from "@/lib/normalize";
import { useTablePreferences } from "@/hooks/useTablePreferences";
import { LEAD_STAGES } from "@/utils/leadStages";
import { DEMO_LEADS } from "@/data/demoLeads";
import type { SortOption } from "@/utils/leadSort";
import type { TableFilters } from "@/hooks/useTablePreferences";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const VALID_STATUSES = ["new", "in_process", "meeting_scheduled", "meeting_done", "waiting_for_approval", "done", "not_done"] as const;

export function useLeads() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);
  const [quoteLead, setQuoteLead] = useState<Lead | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("created_at_asc");
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [savingCell, setSavingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<Tables<"quote_items">["Row"][]>([]);

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    filters: savedFilters,
    views: savedViews,
    saveAsNewView,
    saveAsNewViewPending,
    updateView,
    deleteView,
    resetToDefault,
    resetPending,
  } = useTablePreferences("leads");

  const appliedSavedRef = useRef(false);
  const { user } = useAuth();
  const { data: teamMembers = [], membersByUserId } = useCrmTeam();

  const noMeetingFilter = searchParams.get("noMeeting") === "1";

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (appliedSavedRef.current || !savedFilters) return;
    if (typeof savedFilters.search === "string") {
      setSearch(savedFilters.search);
      setSearchInput(savedFilters.search);
    }
    if (Array.isArray(savedFilters.statusFilter)) {
      setStatusFilter(savedFilters.statusFilter);
    } else if (typeof savedFilters.statusFilter === "string" && savedFilters.statusFilter !== "all") {
      setStatusFilter([savedFilters.statusFilter]);
    }
    if (typeof savedFilters.sourceFilter === "string") setSourceFilter(savedFilters.sourceFilter);
    if (typeof savedFilters.assigneeFilter === "string") setAssigneeFilter(savedFilters.assigneeFilter);
    appliedSavedRef.current = true;
  }, [savedFilters]);

  useEffect(() => {
    const noMeeting = searchParams.get("noMeeting") === "1";
    const urlStatus = searchParams.get("status");
    const urlAssignee = searchParams.get("assignee");
    if (noMeeting) {
      setStatusFilter([]);
      setSourceFilter("all");
      setAssigneeFilter("all");
    } else {
      if (urlStatus && VALID_STATUSES.includes(urlStatus as (typeof VALID_STATUSES)[number])) {
        setStatusFilter([urlStatus]);
      }
      if (urlAssignee) {
        setAssigneeFilter(urlAssignee === "unassigned" ? "unassigned" : urlAssignee);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount for URL params

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["leads", page, search, statusFilter, sourceFilter, assigneeFilter, noMeetingFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        const escaped = escapeIlike(search);
        query = query.or(`customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%`);
      }
      if (noMeetingFilter) {
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
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const leads = leadsData?.data || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const leadIds = leads.map((l) => l.id);
  const { data: leadQuotes = {} } = useQuery({
    queryKey: ["lead-quotes", leadIds.join(",")],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .in("lead_id", leadIds)
        .is("archived_at", null);

      if (error) throw error;

      return quotesByLeadId(data ?? []);
    },
  });

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
  }, [location.state, location.pathname, leads, navigate]);

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

  const currentFilters = (): TableFilters => ({
    search,
    statusFilter,
    sourceFilter,
    assigneeFilter,
  });

  const applyView = (filters: Record<string, string | string[]>) => {
    if (typeof filters.search === "string") {
      setSearch(filters.search);
      setSearchInput(filters.search);
    }
    if (Array.isArray(filters.statusFilter)) {
      setStatusFilter(filters.statusFilter);
    } else if (typeof filters.statusFilter === "string" && filters.statusFilter !== "all") {
      setStatusFilter([filters.statusFilter]);
    } else {
      setStatusFilter([]);
    }
    if (typeof filters.sourceFilter === "string") setSourceFilter(filters.sourceFilter);
    if (typeof filters.assigneeFilter === "string") setAssigneeFilter(filters.assigneeFilter);
    setPage(0);
  };

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
      setSearchInput("");
      setStatusFilter([]);
      setSourceFilter("all");
      setAssigneeFilter("all");
      setPage(0);
      toast.success("Filters reset to default");
    } catch {
      toast.error("Failed to reset preferences");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter([]);
    setSourceFilter("all");
    setAssigneeFilter("all");
    setPage(0);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter.length > 0 ||
    sourceFilter !== "all" ||
    assigneeFilter !== "all";

  const handleSearchChange = (val: string) => setSearchInput(val);
  const handleStatusFilterChange = (vals: string[]) => {
    setStatusFilter(vals);
    setPage(0);
  };
  const handleSourceFilterChange = (val: string) => {
    setSourceFilter(val);
    setPage(0);
  };
  const handleAssigneeFilterChange = (val: string) => {
    setAssigneeFilter(val);
    setPage(0);
  };

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
    updateMutation.mutate({
      id: leadId,
      [field]: value ?? undefined,
      inline: true,
    } as Partial<Lead> & { id: string; inline: boolean });
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

  const handleCreateQuote = (lead: Lead) => {
    setQuoteLead(lead);
    setQuoteBuilderOpen(true);
  };

  const handleViewQuote = async (leadId: string) => {
    const quote = leadQuotes[leadId];
    if (quote) {
      setSelectedQuote(quote);

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

  const bulkStatusOptions = LEAD_STAGES.map((s) => ({ value: s.value, label: s.label }));

  return {
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
    createMutation,
    seedDemoLeadsMutation,
    updateMutation,
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
    deleteView,
  };
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { ProjectKanban } from "@/components/ad-agency/ProjectKanban";
import { ProjectTable } from "@/components/ad-agency/ProjectTable";
import { ProjectFilters } from "@/components/ad-agency/ProjectFilters";
import { ProjectDialog } from "@/components/ad-agency/ProjectDialog";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { ApproveBudgetDialog } from "@/components/ad-agency/ApproveBudgetDialog";
import { toast } from "sonner";
import type { EntityViewMode } from "@/components/entity-page";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;
type OpClient = Tables<"op_clients">;
type ProjectStatus = Database["public"]["Enums"]["op_project_status"];

interface ProjectWithClient extends OpProject {
  op_clients?: { name: string; payment_terms?: string | null } | null;
}

export default function AdAgencyProjects() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null);
  const [viewMode, setViewMode] = useState<EntityViewMode>("kanban");
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const [approveBudgetProject, setApproveBudgetProject] = useState<ProjectWithClient | null>(null);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
    const state = location.state as { clientId?: string } | null;
    if (state?.clientId) {
      setPreselectedClientId(state.clientId);
      setDialogOpen(true);
      window.history.replaceState({}, "", "/ad-agency/projects");
    }
  }, [location.state]);

  const { data: clients = [] } = useQuery({
    queryKey: ["op_clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_clients").select("*").order("name");
      if (error) throw error;
      return data as OpClient[];
    },
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["op_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("*, op_clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectWithClient[];
    },
  });

  const autoTransitionMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("op_projects")
        .update({ status: "collection" as ProjectStatus })
        .eq("status", "completed")
        .lte("end_date", today);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_projects"] });
    },
  });

  useEffect(() => {
    if (isLoading || autoTransitionMutation.isPending) return;
    const today = new Date().toISOString().split("T")[0];
    const needsTransition = projects.some(
      (p) => p.status === "completed" && p.end_date && p.end_date <= today
    );
    if (needsTransition) {
      autoTransitionMutation.mutate();
    }
  }, [projects, isLoading, autoTransitionMutation.isPending]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<OpProject> & { client_id: string; title: string }) => {
      const { error } = await supabase.from("op_projects").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_projects"] });
      toast.success("פרויקט נוצר בהצלחה");
      setDialogOpen(false);
      setPreselectedClientId(null);
    },
    onError: () => toast.error("שגיאה ביצירת פרויקט"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OpProject> }) => {
      const { error } = await supabase.from("op_projects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_projects"] });
      toast.success("פרויקט עודכן בהצלחה");
      setDialogOpen(false);
      setSelectedProject(null);
    },
    onError: () => toast.error("שגיאה בעדכון פרויקט"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_projects"] });
      toast.success("פרויקט נמחק בהצלחה");
      setDialogOpen(false);
      setSelectedProject(null);
    },
    onError: () => toast.error("שגיאה במחיקת פרויקט"),
  });

  const handleSave = (data: Partial<OpProject> & { client_id: string; title: string }) => {
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const APPROVED_STAGES = ["planning", "execution", "collection"];
  const DRAFT_STAGES = ["draft", "waiting_for_approval"];

  const handleStageChange = (projectId: string, stage: string) => {
    const project = projects.find((p) => p.id === projectId);
    const needsBudgetApproval =
      project &&
      DRAFT_STAGES.includes(project.status) &&
      APPROVED_STAGES.includes(stage);

    if (needsBudgetApproval) {
      setApproveBudgetProject(project);
      setPendingStage(stage);
      return;
    }

    updateMutation.mutate({
      id: projectId,
      data: { status: stage as ProjectStatus },
    });
  };

  const handleApproveBudgetConfirm = (budgetApproved: number) => {
    if (!approveBudgetProject || !pendingStage) return;
    updateMutation.mutate(
      {
        id: approveBudgetProject.id,
        data: {
          status: pendingStage as ProjectStatus,
          budget_approved: budgetApproved,
        },
      },
      {
        onSettled: () => {
          setApproveBudgetProject(null);
          setPendingStage(null);
        },
      }
    );
  };

  const handleEdit = (project: ProjectWithClient) => {
    setSelectedProject(project);
    setPreselectedClientId(null);
    setDialogOpen(true);
  };

  const handleAddClick = () => {
    setSelectedProject(null);
    setPreselectedClientId(null);
    setDialogOpen(true);
  };

  const handleDelete = (project: ProjectWithClient) => {
    if (confirm(`האם למחוק את הפרויקט "${project.title}"? פעולה זו תמחק גם משימות ופריטים קשורים.`)) {
      deleteMutation.mutate(project.id);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.op_clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === "all" || p.client_id === clientFilter;
    const matchStatus =
      statusFilter.length === 0 || (p.status && statusFilter.includes(p.status));
    return matchSearch && matchClient && matchStatus;
  });

  const hasActiveFilters = !!search || clientFilter !== "all" || statusFilter.length > 0;
  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("ad-agency-projects");
  const PROJECT_COLUMNS = [
    { id: "title", header: "שם פרויקט" },
    { id: "client", header: "לקוח" },
    { id: "budget", header: "צפי הכנסה" },
    { id: "status", header: "סטטוס" },
  ];
  const handleClearFilters = () => {
    setSearch("");
    setClientFilter("all");
    setStatusFilter([]);
  };

  const projectToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      quickViews={[
        {
          value: "waiting",
          label: "ממתינים לאישור",
          onSelect: () => {
            setStatusFilter(["waiting_for_approval"]);
            setSearch("");
            setClientFilter("all");
          },
        },
        {
          value: "active",
          label: "בביצוע",
          onSelect: () => {
            setStatusFilter(["planning", "execution", "collection"]);
            setSearch("");
            setClientFilter("all");
          },
        },
      ]}
      renderMobileSearch={
        <ProjectFilters
          variant="searchOnly"
          search={search}
          onSearchChange={setSearch}
          clientId={clientFilter}
          onClientChange={setClientFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      }
      renderMobileFilters={
        <ProjectFilters
          variant="filtersOnly"
          search={search}
          onSearchChange={setSearch}
          clientId={clientFilter}
          onClientChange={setClientFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={PROJECT_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
        />
      }
    >
      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        clientId={clientFilter}
        onClientChange={setClientFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </EntityToolbar>
  );

  return (
    <div className="min-w-0">
    <EntityPageShell
      dir="rtl"
      kanbanTabLabel="צינור"
      tableTabLabel="טבלה"
      title="פרויקטים"
      subtitle="ניהול פרויקטים משרד הפרסום"
      addButtonText="פרויקט חדש"
      onAddClick={handleAddClick}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderToolbar={() => projectToolbar}
      renderKanban={
        <ProjectKanban
          projects={filteredProjects}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStageChange={handleStageChange}
        />
      }
      renderTable={
        isLoading ? (
          <div className="text-center py-8 text-muted-foreground">טוען...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">אין פרויקטים</div>
        ) : (
          <ProjectTable
            projects={filteredProjects}
            onEdit={handleEdit}
            onDelete={handleDelete}
            visibleColumnIds={visibleColumnIds}
          />
        )
      }
      isLoading={isLoading}
      isEmpty={filteredProjects.length === 0}
    >
      <ProjectDialog
        key={selectedProject?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setPreselectedClientId(null);
            setSelectedProject(null);
          }
        }}
        project={selectedProject}
        clients={clients.filter((c) => (c.is_active ?? true) || c.id === selectedProject?.client_id || c.id === preselectedClientId)}
        preselectedClientId={preselectedClientId}
        onSave={handleSave}
      />
      <ApproveBudgetDialog
        open={!!approveBudgetProject}
        onOpenChange={(open) => {
          if (!open) {
            setApproveBudgetProject(null);
            setPendingStage(null);
          }
        }}
        projectTitle={approveBudgetProject?.title ?? ""}
        budgetRequired={approveBudgetProject?.budget_required ?? 0}
        onConfirm={handleApproveBudgetConfirm}
        isPending={updateMutation.isPending}
      />
    </EntityPageShell>
    </div>
  );
}

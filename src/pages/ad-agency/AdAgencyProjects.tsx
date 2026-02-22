import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell } from "@/components/entity-page";
import { ProjectKanban } from "@/components/ad-agency/ProjectKanban";
import { ProjectTable } from "@/components/ad-agency/ProjectTable";
import { ProjectDialog } from "@/components/ad-agency/ProjectDialog";
import { toast } from "sonner";
import type { EntityViewMode } from "@/components/entity-page";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;
type OpClient = Tables<"op_clients">;
type ProjectStatus = Database["public"]["Enums"]["op_project_status"];

interface ProjectWithClient extends OpProject {
  op_clients?: { name: string } | null;
}

export default function AdAgencyProjects() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null);
  const [viewMode, setViewMode] = useState<EntityViewMode>("kanban");
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);

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

  const handleSave = (data: Partial<OpProject> & { client_id: string; title: string }) => {
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStageChange = (projectId: string, stage: string) => {
    updateMutation.mutate({
      id: projectId,
      data: { status: stage as ProjectStatus },
    });
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

  return (
    <EntityPageShell
      title="פרויקטים"
      subtitle="ניהול פרויקטים משרד הפרסום"
      addButtonText="פרויקט חדש"
      onAddClick={handleAddClick}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderKanban={
        <ProjectKanban
          projects={projects}
          isLoading={isLoading}
          onEdit={handleEdit}
          onStageChange={handleStageChange}
        />
      }
      renderTable={
        isLoading ? (
          <div className="text-center py-8 text-muted-foreground">טוען...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">אין פרויקטים</div>
        ) : (
          <ProjectTable projects={projects} onEdit={handleEdit} />
        )
      }
      isLoading={isLoading}
      isEmpty={projects.length === 0}
    >
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPreselectedClientId(null);
        }}
        project={selectedProject}
        clients={clients}
        preselectedClientId={preselectedClientId}
        onSave={handleSave}
      />
    </EntityPageShell>
  );
}

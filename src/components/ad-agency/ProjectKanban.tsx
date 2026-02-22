import { EntityKanban } from "@/components/entity-page";
import { ProjectCard } from "./ProjectCard";

interface ProjectWithClient {
  id: string;
  title: string;
  status: string;
  budget_required: number | null;
  budget_approved: number | null;
  start_date: string | null;
  end_date: string | null;
  op_clients?: { name: string } | null;
}

const stageColumns = [
  { id: "draft", label: "טיוטה", color: "bg-muted" },
  { id: "active", label: "פעיל", color: "bg-green-500" },
  { id: "completed", label: "הושלם", color: "bg-blue-500" },
  { id: "cancelled", label: "בוטל", color: "bg-destructive" },
];

interface ProjectKanbanProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (project: ProjectWithClient) => void;
  onStageChange: (projectId: string, stage: string) => void;
}

export function ProjectKanban({ projects, isLoading, onEdit, onStageChange }: ProjectKanbanProps) {
  return (
    <EntityKanban<ProjectWithClient>
      columns={stageColumns}
      items={projects}
      getItemId={(p) => p.id}
      getStatus={(p) => p.status}
      onStatusChange={onStageChange}
      renderCard={(project) => <ProjectCard project={project} onEdit={onEdit} />}
      isLoading={isLoading}
      emptyLabel="אין פרויקטים"
    />
  );
}

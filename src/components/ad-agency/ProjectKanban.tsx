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
  op_clients?: { name: string; payment_terms?: string | null } | null;
}

const stageColumns = [
  { id: "draft", label: "טיוטה", color: "bg-muted" },
  { id: "waiting_for_approval", label: "ממתין לאישור", color: "bg-amber-500" },
  { id: "planning", label: "תכנון", color: "bg-sky-500" },
  { id: "execution", label: "ביצוע", color: "bg-green-500" },
  { id: "collection", label: "גבייה", color: "bg-emerald-500" },
  { id: "completed", label: "הושלם", color: "bg-blue-500" },
  { id: "cancelled", label: "בוטל", color: "bg-destructive" },
];

interface ProjectKanbanProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (project: ProjectWithClient) => void;
  onStageChange: (projectId: string, stage: string) => void;
}

export function ProjectKanban({ projects, isLoading, onEdit, onDelete, onStageChange }: ProjectKanbanProps) {
  return (
    <EntityKanban<ProjectWithClient>
      columns={stageColumns}
      items={projects}
      getItemId={(p) => p.id}
      getStatus={(p) => p.status}
      onStatusChange={onStageChange}
      renderCard={(project) => <ProjectCard project={project} onEdit={onEdit} onDelete={onDelete} />}
      isLoading={isLoading}
      emptyLabel="אין פרויקטים"
    />
  );
}

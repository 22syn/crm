import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, GripVertical, Pencil, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";

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

interface ProjectCardProps {
  project: ProjectWithClient;
  onEdit: (project: ProjectWithClient) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-700",
  completed: "bg-blue-500/20 text-blue-700",
  cancelled: "bg-destructive/20 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  active: "פעיל",
  completed: "הושלם",
  cancelled: "בוטל",
};

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style: React.CSSProperties = isDragging
    ? { transform: CSS.Translate.toString(transform), opacity: 0.5 }
    : {};

  const budget = project.budget_approved ?? project.budget_required ?? 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-sm cursor-grab active:cursor-grabbing transition-shadow duration-200 ease-out shadow-sm hover:shadow-lg"
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0">
              <GripVertical className="h-4 w-4" />
            </div>
            <Link to={`/ad-agency/projects/${project.id}`} className="font-medium text-sm line-clamp-2 hover:underline">
              {project.title}
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {project.op_clients?.name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{project.op_clients.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <DollarSign className="h-3 w-3" />
          <span>₪{Number(budget).toLocaleString("he-IL")}</span>
        </div>
        {project.end_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(project.end_date), "d MMM", { locale: he })}</span>
          </div>
        )}
        <Badge className={`text-xs ${STATUS_COLORS[project.status] ?? ""}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </Badge>
      </CardContent>
    </Card>
  );
}

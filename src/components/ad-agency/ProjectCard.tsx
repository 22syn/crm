import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, DollarSign, FileText, GripVertical, ListTodo, MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

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

interface ProjectCardProps {
  project: ProjectWithClient;
  onEdit: (project: ProjectWithClient) => void;
  onDelete?: (project: ProjectWithClient) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-700",
  waiting_for_approval: "bg-amber-500/20 text-amber-700",
  planning: "bg-sky-500/20 text-sky-700",
  execution: "bg-green-500/20 text-green-700",
  collection: "bg-emerald-500/20 text-emerald-700",
  completed: "bg-blue-500/20 text-blue-700",
  cancelled: "bg-destructive/20 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  active: "פעיל",
  waiting_for_approval: "ממתין לאישור",
  planning: "תכנון",
  execution: "ביצוע",
  collection: "גבייה",
  completed: "הושלם",
  cancelled: "בוטל",
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
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
          {onDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild>
                  <Link to={`/ad-agency/projects/${project.id}?quote=1`} onClick={(e) => e.stopPropagation()}>
                    <FileText className="h-3 w-3 mr-2" />
                    בנה הצעת מחיר
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    navigate(`/ad-agency/tasks?project=${project.id}`);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListTodo className="h-3 w-3 mr-2" />
                  משימות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  <Pencil className="h-3 w-3 mr-2" />
                  עריכה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2" />
                  מחיקה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild>
                  <Link to={`/ad-agency/projects/${project.id}?quote=1`} onClick={(e) => e.stopPropagation()}>
                    <FileText className="h-3 w-3 mr-2" />
                    בנה הצעת מחיר
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    navigate(`/ad-agency/tasks?project=${project.id}`);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListTodo className="h-3 w-3 mr-2" />
                  משימות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  <Pencil className="h-3 w-3 mr-2" />
                  עריכה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
        {(project.start_date || project.end_date || project.op_clients?.payment_terms) && (
          <div className="flex flex-col gap-0.5">
            {project.start_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>תאריך התחלה: {format(new Date(project.start_date), "d MMM", { locale: he })}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>תאריך סיום: {format(new Date(project.end_date), "d MMM", { locale: he })}</span>
              </div>
            )}
            {project.op_clients?.payment_terms && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-6">
                <span>תנאי תשלום: {project.op_clients.payment_terms}</span>
              </div>
            )}
          </div>
        )}
        <Badge className={`text-xs ${STATUS_COLORS[project.status] ?? ""}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </Badge>
      </CardContent>
    </Card>
  );
}

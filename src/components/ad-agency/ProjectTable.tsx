import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  waiting_for_approval: "ממתין לאישור",
  planning: "תכנון",
  execution: "ביצוע",
  collection: "גבייה",
  completed: "הושלם",
  cancelled: "בוטל",
};

interface ProjectTableProps {
  projects: ProjectWithClient[];
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (project: ProjectWithClient) => void;
}

export function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>שם פרויקט</TableHead>
          <TableHead>לקוח</TableHead>
          <TableHead>צפי הכנסה</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              <Link to={`/ad-agency/projects/${p.id}`} className="text-primary hover:underline">
                {p.title}
              </Link>
            </TableCell>
            <TableCell>{p.op_clients?.name ?? "-"}</TableCell>
            <TableCell>{p.budget_approved != null ? `₪${Number(p.budget_approved).toLocaleString("he-IL")}` : "-"}</TableCell>
            <TableCell>{STATUS_LABELS[p.status] ?? p.status}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(p)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    עריכה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(p)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    מחיקה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

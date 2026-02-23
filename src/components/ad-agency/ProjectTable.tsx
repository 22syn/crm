import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, ListTodo, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  waiting_for_approval: "ממתין לאישור",
  planning: "תכנון",
  execution: "ביצוע",
  collection: "גבייה",
  completed: "הושלם",
  cancelled: "בוטל",
};

interface ProjectWithClient {
  id: string;
  title: string;
  status: string;
  budget_required: number | null;
  budget_approved: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  op_clients?: { name: string } | null;
}

interface ProjectTableProps {
  projects: ProjectWithClient[];
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (project: ProjectWithClient) => void;
  /** When provided, sort is controlled from parent (toolbar) */
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onHeaderSort?: (field: string) => void;
  visibleColumnIds?: string[] | null;
}

export function ProjectTable({
  projects,
  onEdit,
  onDelete,
  sortField: controlledSortField,
  sortDirection: controlledSortDirection,
  onHeaderSort,
  visibleColumnIds,
}: ProjectTableProps) {
  const navigate = useNavigate();
  const [internalSortField, setInternalSortField] = useState("created_at");
  const [internalSortDirection, setInternalSortDirection] = useState<"asc" | "desc">("desc");

  const isControlled = controlledSortField != null && onHeaderSort != null;
  const sortField = isControlled ? controlledSortField : internalSortField;
  const sortDirection = isControlled ? (controlledSortDirection ?? "desc") : internalSortDirection;

  const handleHeaderSort = (field: string) => {
    if (onHeaderSort) {
      onHeaderSort(field);
    } else {
      setInternalSortField(field);
      setInternalSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const columns: DataTableColumn<ProjectWithClient>[] = useMemo(
    () => [
      {
        id: "title",
        header: "שם פרויקט",
        sortable: true,
        sortKey: "title",
        minWidth: "180px",
        render: (p) => (
          <Link to={`/ad-agency/projects/${p.id}`} className="text-primary hover:underline font-medium">
            {p.title}
          </Link>
        ),
      },
      {
        id: "client",
        header: "לקוח",
        sortable: true,
        sortKey: "client",
        render: (p) => p.op_clients?.name ?? "-",
      },
      {
        id: "budget",
        header: "צפי הכנסה",
        sortable: true,
        sortKey: "budget",
        render: (p) =>
          p.budget_approved != null ? `₪${Number(p.budget_approved).toLocaleString("he-IL")}` : "-",
      },
      {
        id: "status",
        header: "סטטוס",
        sortable: true,
        sortKey: "status",
        render: (p) => STATUS_LABELS[p.status] ?? p.status,
      },
    ],
    []
  );

  const displayedColumns = useMemo(() => {
    if (!visibleColumnIds || visibleColumnIds.length === 0) return columns;
    const set = new Set(visibleColumnIds);
    const filtered = columns.filter((c) => set.has(c.id));
    return filtered.length > 0 ? filtered : columns;
  }, [columns, visibleColumnIds]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aVal: string | number | undefined;
      let bVal: string | number | undefined;
      if (sortField === "title") {
        aVal = a.title ?? "";
        bVal = b.title ?? "";
      } else if (sortField === "client") {
        aVal = a.op_clients?.name ?? "";
        bVal = b.op_clients?.name ?? "";
      } else if (sortField === "budget") {
        aVal = a.budget_approved ?? 0;
        bVal = b.budget_approved ?? 0;
      } else if (sortField === "status") {
        aVal = a.status ?? "";
        bVal = b.status ?? "";
      } else {
        aVal = a.created_at ?? "";
        bVal = b.created_at ?? "";
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr, "he");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [projects, sortField, sortDirection]);

  return (
    <DataTable<ProjectWithClient>
      columns={displayedColumns}
      data={sortedProjects}
      getRowId={(p) => p.id}
      emptyMessage="אין פרויקטים"
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      actionsHeader="פעולות"
      renderActions={(p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/ad-agency/projects/${p.id}?quote=1`}>
                <FileText className="h-4 w-4 mr-2" />
                בנה הצעת מחיר
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                navigate(`/ad-agency/tasks?project=${p.id}`);
              }}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              משימות
            </DropdownMenuItem>
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
      )}
    />
  );
}

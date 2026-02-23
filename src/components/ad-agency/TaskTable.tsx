import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const TASK_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "todo", label: "לבצע" },
  { value: "in_progress", label: "בביצוע" },
  { value: "done", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

interface TaskWithProject {
  id: string;
  title: string;
  project_id: string;
  status: string;
  end_date: string | null;
  op_projects?: { id: string; title: string } | null;
}

interface TaskTableProps {
  tasks: TaskWithProject[];
  onEdit: (task: TaskWithProject) => void;
  onDelete: (task: TaskWithProject) => void;
  visibleColumnIds?: string[] | null;
}

export function TaskTable({ tasks, onEdit, onDelete, visibleColumnIds }: TaskTableProps) {
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const columns: DataTableColumn<TaskWithProject>[] = useMemo(
    () => [
      {
        id: "title",
        header: "כותרת",
        sortable: true,
        sortKey: "title",
        minWidth: "200px",
        render: (t) => <span className="font-medium">{t.title}</span>,
      },
      {
        id: "project",
        header: "פרויקט",
        sortable: true,
        sortKey: "project",
        render: (t) => (
          <Link
            to={`/ad-agency/projects/${t.project_id}`}
            className="text-primary hover:underline"
          >
            {t.op_projects?.title ?? "-"}
          </Link>
        ),
      },
      {
        id: "status",
        header: "סטטוס",
        sortable: true,
        sortKey: "status",
        render: (t) =>
          TASK_STATUS_OPTIONS.find((o) => o.value === t.status)?.label ?? t.status,
      },
      {
        id: "end_date",
        header: "תאריך סיום",
        sortable: true,
        sortKey: "end_date",
        render: (t) =>
          t.end_date
            ? format(new Date(t.end_date), "d MMM yyyy", { locale: he })
            : "-",
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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let aVal: string | number | undefined;
      let bVal: string | number | undefined;
      if (sortField === "title") {
        aVal = a.title ?? "";
        bVal = b.title ?? "";
      } else if (sortField === "project") {
        aVal = a.op_projects?.title ?? "";
        bVal = b.op_projects?.title ?? "";
      } else if (sortField === "status") {
        aVal = a.status ?? "";
        bVal = b.status ?? "";
      } else if (sortField === "end_date") {
        aVal = a.end_date ?? "";
        bVal = b.end_date ?? "";
      } else {
        aVal = (a as TaskWithProject & { created_at?: string }).created_at ?? "";
        bVal = (b as TaskWithProject & { created_at?: string }).created_at ?? "";
      }
      const cmp = String(aVal).localeCompare(String(bVal), "he");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [tasks, sortField, sortDirection]);

  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <DataTable<TaskWithProject>
      columns={displayedColumns}
      data={sortedTasks}
      getRowId={(t) => t.id}
      emptyMessage="אין משימות"
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      actionsHeader="פעולות"
      renderActions={(task) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm("למחוק משימה?")) onDelete(task);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                מחיקה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  );
}

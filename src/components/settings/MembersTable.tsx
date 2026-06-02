import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Module, ModuleRole } from "@/contexts/AuthContext";

const MODULE_LABELS: Record<Module, string> = {
  leads: "לידים",
  ad_agency: "משרד פרסום",
  system: "הגדרות מערכת",
};

export interface TeamMember {
  user_id: string;
  email: string | null;
  full_name: string | null;
  moduleRoles: Partial<Record<Module, ModuleRole>>;
}

interface MembersTableProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  isRemoving?: boolean;
}

export function MembersTable({ members, onEdit, onRemove, isRemoving = false }: MembersTableProps) {
  const columns: DataTableColumn<TeamMember>[] = useMemo(
    () => [
      {
        id: "name",
        header: "שם",
        render: (m) => m.full_name || "—",
      },
      {
        id: "email",
        header: "אימייל",
        render: (m) => m.email || "—",
      },
      {
        id: "permissions",
        header: "הרשאות",
        render: (m) => (
          <div className="flex flex-wrap gap-1">
            {(Object.entries(m.moduleRoles) as [Module, ModuleRole][]).map(([mod, role]) => (
              <Badge
                key={mod}
                variant={role === "admin" ? "default" : "secondary"}
                className="text-xs"
              >
                {MODULE_LABELS[mod]}: {role === "admin" ? "Admin" : "User"}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable<TeamMember>
      columns={columns}
      data={members}
      getRowId={(m) => m.user_id}
      emptyMessage="אין חברי צוות מוגדרים"
      variant="stitch"
      actionsHeader=""
      renderActions={(m) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(m)}
            disabled={isRemoving}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={() => onRemove(m)}
            disabled={isRemoving}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    />
  );
}

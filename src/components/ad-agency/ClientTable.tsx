import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, UserX, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;

interface ClientTableProps {
  clients: OpClient[];
  isAdmin: boolean;
  onEdit: (client: OpClient) => void;
  onDelete: (client: OpClient) => void;
  onSetActive?: (client: OpClient, isActive: boolean) => void;
  visibleColumnIds?: string[] | null;
}

export function ClientTable({ clients, isAdmin, onEdit, onDelete, onSetActive, visibleColumnIds }: ClientTableProps) {
  const columns: DataTableColumn<OpClient>[] = useMemo(
    () => [
      {
        id: "name",
        header: "שם",
        sortable: true,
        sortKey: "name",
        minWidth: "160px",
        render: (client) => (
          <Link to={`/ad-agency/clients/${client.id}`} className="text-primary hover:underline font-medium">
            {client.name}
          </Link>
        ),
      },
      {
        id: "status",
        header: "סטטוס",
        sortable: true,
        sortKey: "is_active",
        render: (client) =>
          (client.is_active ?? true) ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-700">
              פעיל
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              לא פעיל
            </Badge>
          ),
      },
      {
        id: "contact_name",
        header: "איש קשר",
        render: (client) => client.contact_name || "-",
      },
      {
        id: "contact_phone",
        header: "טלפון איש קשר",
        render: (client) => client.contact_phone || "-",
      },
      {
        id: "phone",
        header: "טלפון",
        render: (client) => client.phone || "-",
      },
      {
        id: "email",
        header: "אימייל",
        render: (client) => client.email || "-",
      },
      {
        id: "address",
        header: "כתובת",
        minWidth: "140px",
        render: (client) => (client.address ? <span className="inline-block max-w-[180px] truncate" title={client.address}>{client.address}</span> : "-"),
      },
      {
        id: "payment_terms",
        header: "תנאי תשלום",
        render: (client) => client.payment_terms || "-",
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

  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const aVal = a[sortField as keyof OpClient];
      const bVal = b[sortField as keyof OpClient];
      if (sortField === "is_active") {
        const aAct = a.is_active ?? true ? 1 : 0;
        const bAct = b.is_active ?? true ? 1 : 0;
        return sortDirection === "asc" ? aAct - bAct : bAct - aAct;
      }
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      const cmp = aStr.localeCompare(bStr, "he");
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [clients, sortField, sortDirection]);

  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <DataTable<OpClient>
      columns={displayedColumns}
      data={sortedClients}
      getRowId={(c) => c.id}
      emptyMessage="לא נמצאו לקוחות"
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      actionsHeader="פעולות"
      renderActions={(client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="h-4 w-4 mr-2" />
              עריכה
            </DropdownMenuItem>
            {onSetActive && (
              <DropdownMenuItem onClick={() => onSetActive(client, !(client.is_active ?? true))}>
                {(client.is_active ?? true) ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    הפוך ללא פעיל
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    הפוך לפעיל
                  </>
                )}
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                מחיקה
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Mail, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Supplier = Tables<"suppliers">;

const CATEGORY_LABELS: Record<string, string> = {
  sofas: "Sofas",
  cabinets: "Cabinets",
  chairs: "Chairs",
  tables: "Tables",
};

interface SupplierTableProps {
  suppliers: Supplier[];
  isAdmin?: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  visibleColumnIds?: string[] | null;
}

export function SupplierTable({ suppliers, isAdmin = false, onEdit, onDelete, visibleColumnIds }: SupplierTableProps) {
  const columns: DataTableColumn<Supplier>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        render: (supplier) => <span className="font-medium">{supplier.name}</span>,
      },
      {
        id: "category",
        header: "Category",
        render: (supplier) =>
          supplier.category ? (
            <Badge variant="outline">{CATEGORY_LABELS[supplier.category] || supplier.category}</Badge>
          ) : (
            "-"
          ),
      },
      {
        id: "contact",
        header: "Contact",
        render: (supplier) => supplier.contact_name || "-",
      },
      {
        id: "contact_details",
        header: "Contact Details",
        render: (supplier) => (
          <div className="flex flex-col gap-1">
            {supplier.email && (
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3" />
                <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            {!supplier.email && !supplier.phone && "-"}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (supplier) => (
          <Badge variant={supplier.is_active ? "default" : "secondary"}>
            {supplier.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
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

  return (
    <DataTable<Supplier>
      columns={displayedColumns}
      data={suppliers}
      getRowId={(s) => s.id}
      emptyMessage="No suppliers found"
      variant="stitch"
      renderActions={(supplier) =>
        isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(supplier)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(supplier)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    />
  );
}

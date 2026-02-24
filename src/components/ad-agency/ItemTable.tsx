import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;

interface Section {
  id: string;
  name: string;
  sort_order: number;
}

interface ItemTableProps {
  items: OpItem[];
  sections?: Section[];
  isAdmin: boolean;
  onEdit: (item: OpItem) => void;
  onDelete: (item: OpItem) => void;
  visibleColumnIds?: string[] | null;
}

export function ItemTable({ items, sections = [], isAdmin, onEdit, onDelete, visibleColumnIds }: ItemTableProps) {
  const [sortField, setSortField] = useState("type");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s.name])), [sections]);

  const columns: DataTableColumn<OpItem>[] = useMemo(
    () => [
      ...(sections.length > 0
        ? [
            {
              id: "section",
              header: "סקציה",
              sortable: true,
              sortKey: "section_id",
              minWidth: "140px",
              render: (item: OpItem) => {
                const sid = (item as OpItem & { section_id?: string | null }).section_id;
                return sid ? sectionMap.get(sid) ?? "-" : "-";
              },
            } as DataTableColumn<OpItem>,
          ]
        : []),
      {
        id: "type",
        header: "סוג",
        sortable: true,
        sortKey: "type",
        minWidth: "160px",
        render: (item) => <span className="font-medium">{item.type}</span>,
      },
      {
        id: "price",
        header: "מחיר (₪)",
        sortable: true,
        sortKey: "price",
        render: (item) => Number(item.price).toLocaleString("he-IL"),
      },
    ],
    [sections.length, sectionMap]
  );

  const displayedColumns = useMemo(() => {
    if (!visibleColumnIds || visibleColumnIds.length === 0) return columns;
    const set = new Set(visibleColumnIds);
    const filtered = columns.filter((c) => set.has(c.id));
    return filtered.length > 0 ? filtered : columns;
  }, [columns, visibleColumnIds]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortField === "price") {
        const aVal = Number(a.price) || 0;
        const bVal = Number(b.price) || 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (sortField === "section_id" || sortField === "section") {
        const aSec = (a as OpItem & { section_id?: string | null }).section_id ?? "";
        const bSec = (b as OpItem & { section_id?: string | null }).section_id ?? "";
        const aName = sectionMap.get(aSec) ?? "";
        const bName = sectionMap.get(bSec) ?? "";
        const cmp = aName.localeCompare(bName, "he");
        return sortDirection === "asc" ? cmp : -cmp;
      }
      const aStr = (a.type ?? "").toLowerCase();
      const bStr = (b.type ?? "").toLowerCase();
      const cmp = aStr.localeCompare(bStr, "he");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [items, sortField, sortDirection, sectionMap]);

  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <DataTable<OpItem>
      columns={displayedColumns}
      data={sortedItems}
      getRowId={(i) => i.id}
      emptyMessage="לא נמצאו פריטים"
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      actionsHeader="פעולות"
      renderActions={(item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4 mr-2" />
              עריכה
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  sortable?: boolean;
  sortKey?: string;
  minWidth?: string;
  /** Render cell content. Receives row and row index. */
  render: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  /** Sort dropdown - when provided, shows "Sort by" dropdown above table */
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  /** Header sort - when provided, column headers with sortable trigger sort */
  sortField?: string;
  sortDirection?: SortDirection;
  onHeaderSort?: (field: string) => void;
  /** Selection */
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Actions column */
  renderActions: (row: T, index: number) => React.ReactNode;
  actionsHeader?: string;
  /** Stitch design variant: rounded card, uppercase headers, hover styling */
  variant?: "default" | "stitch";
  /** Footer slot (e.g. pagination) — renders inside card when variant=stitch */
  renderFooter?: React.ReactNode;
  /** Sprint 2: Sticky first column when scrolling horizontally (default: true for stitch) */
  stickyFirstColumn?: boolean;
}

function getSortIcon(sortField: string, sortKey: string, sortDirection: SortDirection) {
  if (sortField !== sortKey) return <ArrowUpDown className="h-4 w-4 ml-1" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="h-4 w-4 ml-1" />
  ) : (
    <ArrowDown className="h-4 w-4 ml-1" />
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  emptyMessage = "No data found",
  sortOptions,
  sortValue,
  onSortChange,
  sortField,
  sortDirection = "asc",
  onHeaderSort,
  enableSelection,
  selectedIds = new Set(),
  onSelectionChange,
  renderActions,
  actionsHeader = "Actions",
  variant = "default",
  renderFooter,
  stickyFirstColumn,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds.has(getRowId(row)));
  const someSelected = selectedIds.size > 0;

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => getRowId(row))));
    }
  };

  const handleToggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const colCount = columns.length + (enableSelection ? 1 : 0) + 1; // +1 for actions

  const isStitch = variant === "stitch";
  const useStickyFirst = stickyFirstColumn ?? isStitch;
  const tableWrapperClass = isStitch
    ? "rounded-xl border overflow-hidden bg-card"
    : "rounded-sm border overflow-x-auto scroll-shadow-x";

  return (
    <div className="space-y-3">
      {sortOptions && sortValue !== undefined && onSortChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className={`w-[220px] h-8 ${isStitch ? "rounded-lg" : "rounded-sm"}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={tableWrapperClass} style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div
          className={
            isStitch
              ? "overflow-x-auto scroll-shadow-x [&_td]:px-6 [&_td]:py-4 [&_thead]:bg-card [&_thead_th]:bg-card"
              : undefined
          }
          data-sticky-first-col={useStickyFirst ? "" : undefined}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {enableSelection && (
                  <TableHead className={`w-10 ${isStitch ? "px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" : ""}`}>
                    <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={handleToggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={`${col.minWidth ? "" : ""} ${isStitch ? "px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" : ""} ${col.headerClassName ?? ""}`}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                >
                  {col.sortable && onHeaderSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 hover:bg-transparent"
                      onClick={() => onHeaderSort(col.sortKey ?? col.id)}
                    >
                      {col.header}
                      {getSortIcon(sortField ?? "", col.sortKey ?? col.id, sortDirection)}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              <TableHead className={isStitch ? "w-[100px] px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" : "w-[100px]"}>{actionsHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const id = getRowId(row);
                return (
                  <TableRow key={id} className={`group ${isStitch ? "hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors" : "hover:bg-muted/50"}`}>
                    {enableSelection && (
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={() => handleToggleOne(id)}
                          aria-label={`Select row ${id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.cellClassName}>
                        {col.render(row, index)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-0.5">{renderActions(row, index)}</div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
        {isStitch && renderFooter && (
          <div className="px-6 py-4 flex items-center justify-between border-t">
            {renderFooter}
          </div>
        )}
      </div>
    </div>
  );
}

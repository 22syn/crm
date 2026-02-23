import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns, RotateCcw } from "lucide-react";

export interface ColumnDef {
  id: string;
  header: string;
}

interface ColumnVisibilityDropdownProps {
  allColumns: ColumnDef[];
  visibleIds: string[] | null;
  onChange: (ids: string[]) => void;
  onReset: () => void;
  resetPending?: boolean;
}

export function ColumnVisibilityDropdown({
  allColumns,
  visibleIds,
  onChange,
  onReset,
  resetPending = false,
}: ColumnVisibilityDropdownProps) {
  const effectiveVisible = visibleIds ?? allColumns.map((c) => c.id);

  const toggle = (id: string) => {
    const isVisible = effectiveVisible.includes(id);
    if (isVisible && effectiveVisible.length <= 1) return; // Keep at least one
    if (isVisible) {
      onChange(effectiveVisible.filter((x) => x !== id));
    } else {
      const idx = allColumns.findIndex((c) => c.id === id);
      const next = [...effectiveVisible];
      next.splice(idx, 0, id);
      onChange(next);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 h-9 rounded-md font-normal">
          <Columns className="h-4 w-4 mr-1.5 shrink-0" />
          עמודות
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {allColumns.map((col) => (
          <label
            key={col.id}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
          >
            <Checkbox
              checked={effectiveVisible.includes(col.id)}
              onCheckedChange={() => toggle(col.id)}
            />
            {col.header}
          </label>
        ))}
        <DropdownMenuSeparator />
        <button
          type="button"
          onClick={onReset}
          disabled={resetPending || visibleIds === null}
          className="flex items-center gap-2 px-2 py-1.5 w-full text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          איפוס לברירת מחדל
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

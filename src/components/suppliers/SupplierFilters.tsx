import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SupplierFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (value: boolean) => void;
  /** default: full; searchOnly: search only (mobile); filtersOnly: active toggle only (mobile sheet) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function SupplierFilters({
  search,
  onSearchChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  variant = "default",
}: SupplierFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <Button
          variant={showActiveOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onShowActiveOnlyChange(!showActiveOnly)}
          className="w-full sm:w-auto h-9 rounded-md font-normal shrink-0"
        >
          {showActiveOnly ? "Active Only" : "Show All"}
        </Button>
      )}
    </div>
  );
}

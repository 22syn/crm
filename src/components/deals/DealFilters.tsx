import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DealStage =
  | "quote_approved"
  | "in_production"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "cancelled";

const stageOptions: { value: "all" | DealStage; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "quote_approved", label: "Quote Approved" },
  { value: "in_production", label: "In Production" },
  { value: "ready_for_delivery", label: "Ready for Delivery" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface DealFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  /** default: Search + Stage + Clear; searchOnly: only Search; filtersOnly: Stage + Clear (if hasFilters) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function DealFilters({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  variant = "default",
}: DealFiltersProps) {
  const hasFilters = search || stageFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStageFilterChange("all");
  };

  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <>
          <Select value={stageFilter} onValueChange={onStageFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-md shrink-0">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

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
}

export function DealFilters({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
}: DealFiltersProps) {
  const hasFilters = search || stageFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStageFilterChange("all");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-tight">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by deal title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-sm"
        />
      </div>
      <Select value={stageFilter} onValueChange={onStageFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px] rounded-sm">
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
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

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

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
];

interface QuoteFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  archivedCount?: number;
  /** default: Search + Status + Clear; searchOnly: only Search; filtersOnly: Status + Clear (if hasFilters) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function QuoteFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  archivedCount = 0,
  variant = "default",
}: QuoteFiltersProps) {
  const hasFilters = search || statusFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
  };

  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  const options =
    archivedCount > 0
      ? [
          ...statusOptions.filter((o) => o.value !== "archived"),
          { value: "archived", label: `Archived (${archivedCount})` },
        ]
      : statusOptions.filter((o) => o.value !== "archived");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-md shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
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

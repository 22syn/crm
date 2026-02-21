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
}

export function QuoteFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  archivedCount = 0,
}: QuoteFiltersProps) {
  const hasFilters = search || statusFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
  };

  const options =
    archivedCount > 0
      ? [
          ...statusOptions.filter((o) => o.value !== "archived"),
          { value: "archived", label: `Archived (${archivedCount})` },
        ]
      : statusOptions.filter((o) => o.value !== "archived");

  return (
    <div className="flex flex-col sm:flex-row gap-tight">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer, contract #..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px] rounded-sm">
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
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

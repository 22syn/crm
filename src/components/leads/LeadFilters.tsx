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

interface LeadFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "0 - New" },
  { value: "in_process", label: "1 - In Process" },
  { value: "meeting_scheduled", label: "2 - Meeting Scheduled" },
  { value: "meeting_done", label: "2.5 - Meeting Done" },
  { value: "waiting_for_approval", label: "3 - Waiting for Approval" },
  { value: "done", label: "4 - Done" },
  { value: "not_done", label: "Not Done" },
];

const sourceOptions = [
  { value: "all", label: "All Sources" },
  { value: "instagram", label: "📷 Instagram" },
  { value: "website", label: "🌐 Website" },
  { value: "architects", label: "🏛️ Architects/Designers" },
  { value: "organic", label: "🌱 Organic" },
  { value: "facebook", label: "📘 Facebook" },
];

export function LeadFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
}: LeadFiltersProps) {
  const hasFilters = search || statusFilter !== "all" || sourceFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onSourceFilterChange("all");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
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

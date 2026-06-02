import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CustomerStatus = Database["public"]["Enums"]["customer_status"];

const STATUS_OPTIONS: { value: CustomerStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "closed", label: "Closed", color: "bg-green-500" },
  { value: "returning", label: "Returning", color: "bg-purple-500" },
];

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: CustomerStatus | "all";
  onStatusFilterChange: (value: CustomerStatus | "all") => void;
  /** default: full; searchOnly: search only (mobile); filtersOnly: status only (mobile sheet) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function CustomerFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  variant = "default",
}: CustomerFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  const statusTriggerLabel =
    statusFilter === "all"
      ? "Status"
      : STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? "Status";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-[160px] h-9 justify-between rounded-md font-normal shrink-0"
            >
              <span className="truncate">{statusTriggerLabel}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-2" align="start">
            <div className="space-y-1">
              <label className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer">
                <Checkbox
                  checked={statusFilter === "all"}
                  onCheckedChange={() => onStatusFilterChange("all")}
                />
                All
              </label>
              {STATUS_OPTIONS.map((s) => (
                <label
                  key={s.value}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={statusFilter === s.value}
                    onCheckedChange={() => onStatusFilterChange(s.value)}
                  />
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                  {s.label}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

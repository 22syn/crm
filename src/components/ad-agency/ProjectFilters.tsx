import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROJECT_STATUS_OPTIONS = [
  { value: "draft", label: "טיוטה" },
  { value: "waiting_for_approval", label: "ממתין לאישור" },
  { value: "planning", label: "תכנון" },
  { value: "execution", label: "ביצוע" },
  { value: "collection", label: "גבייה" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  clientId: string;
  onClientChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  clients: { id: string; name: string | null }[];
  /** default: full; searchOnly: רק חיפוש; filtersOnly: רק לקוח וסטטוס (למובייל) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function ProjectFilters({
  search,
  onSearchChange,
  clientId,
  onClientChange,
  statusFilter,
  onStatusFilterChange,
  clients,
  variant = "default",
}: ProjectFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";
  const toggleStatus = (value: string) => {
    if (statusFilter.includes(value)) {
      const next = statusFilter.filter((s) => s !== value);
      onStatusFilterChange(next.length > 0 ? next : []);
    } else {
      onStatusFilterChange([...statusFilter, value]);
    }
  };

  const statusTriggerLabel =
    statusFilter.length === 0
      ? "כל הסטטוסים"
      : statusFilter.length === 1
        ? PROJECT_STATUS_OPTIONS.find((s) => s.value === statusFilter[0])?.label ?? statusFilter[0]
        : `${statusFilter.length} סטטוסים`;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0" dir="rtl">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="חיפוש פרויקט..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <>
      <Select value={clientId} onValueChange={onClientChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-md font-normal shrink-0">
          <SelectValue placeholder="כל הלקוחות" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הלקוחות</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name ?? c.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-[160px] h-9 justify-between rounded-md font-normal shrink-0"
          >
            <span className="truncate">{statusTriggerLabel}</span>
            <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2" align="end">
          <div className="space-y-1">
            <label
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer"
              dir="rtl"
            >
              <Checkbox
                checked={statusFilter.length === 0}
                onCheckedChange={() => onStatusFilterChange([])}
              />
              כל הסטטוסים
            </label>
            {PROJECT_STATUS_OPTIONS.map((stage) => (
              <label
                key={stage.value}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer"
                dir="rtl"
              >
                <Checkbox
                  checked={statusFilter.includes(stage.value)}
                  onCheckedChange={() => toggleStatus(stage.value)}
                />
                {stage.label}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
        </>
      )}
    </div>
  );
}

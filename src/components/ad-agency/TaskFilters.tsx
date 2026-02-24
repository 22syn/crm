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
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "לבצע" },
  { value: "in_progress", label: "בביצוע" },
  { value: "done", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  projectId: string;
  onProjectChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  projects: { id: string; title: string }[];
  /** default: full; searchOnly: רק חיפוש; filtersOnly: רק פרויקט וסטטוס (למובייל) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function TaskFilters({
  search,
  onSearchChange,
  projectId,
  onProjectChange,
  statusFilter,
  onStatusFilterChange,
  projects,
  variant = "default",
}: TaskFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  const statusTriggerLabel =
    statusFilter.length === 0
      ? "כל הסטטוסים"
      : statusFilter.length === 1
        ? TASK_STATUS_OPTIONS.find((s) => s.value === statusFilter[0])?.label ?? statusFilter[0]
        : `${statusFilter.length} סטטוסים`;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0" dir="rtl">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Input
            placeholder="חיפוש משימות..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-3 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && (
        <>
          <Select value={projectId || "all"} onValueChange={onProjectChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-md font-normal shrink-0">
              <SelectValue placeholder="כל הפרויקטים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הפרויקטים</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
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
                {TASK_STATUS_OPTIONS.map((s) => (
                  <label
                    key={s.value}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer"
                    dir="rtl"
                  >
                    <Checkbox
                      checked={statusFilter.includes(s.value)}
                      onCheckedChange={() => {
                        if (statusFilter.includes(s.value)) {
                          onStatusFilterChange(statusFilter.filter((x) => x !== s.value));
                        } else {
                          onStatusFilterChange([...statusFilter, s.value]);
                        }
                      }}
                    />
                    {s.label}
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

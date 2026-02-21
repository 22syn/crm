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
import { SOURCE_ICONS } from "@/utils/sourceIcons";
import { LEAD_STAGES } from "@/utils/leadStages";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";

interface LeadFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Empty array = all statuses, non-empty = only these statuses */
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  teamMembers: CrmTeamMember[];
  /** default: full layout; searchOnly: only Search; filtersOnly: only Status + Source + Assignee */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

const sourceOptions = [
  { value: "all", label: "All Sources" },
  ...Object.entries(SOURCE_ICONS).map(([value, { label }]) => ({
    value,
    label: value === "architects" ? "Architects/Designers" : label,
  })),
];

export function LeadFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  teamMembers,
  variant = "default",
}: LeadFiltersProps) {
  const toggleStatus = (value: string) => {
    if (statusFilter.includes(value)) {
      const next = statusFilter.filter((s) => s !== value);
      onStatusFilterChange(next.length > 0 ? next : []);
    } else {
      onStatusFilterChange([...statusFilter, value]);
    }
  };

  const selectAllStatuses = () => onStatusFilterChange([]);
  const statusTriggerLabel = statusFilter.length === 0
    ? "All Statuses"
    : statusFilter.length === 1
      ? LEAD_STAGES.find((s) => s.value === statusFilter[0])?.label ?? statusFilter[0]
      : `${statusFilter.length} statuses`;

  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-md text-sm"
          />
        </div>
      )}

      {showFilters && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-[160px] h-9 justify-between rounded-md font-normal shrink-0">
                <span className="truncate">{statusTriggerLabel}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <div className="space-y-1">
                <label className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={statusFilter.length === 0}
                    onCheckedChange={() => selectAllStatuses()}
                  />
                  All Statuses
                </label>
                {LEAD_STAGES.map((stage) => (
                  <label
                    key={stage.value}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer"
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

          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 rounded-md shrink-0">
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

          <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
            <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-md shrink-0">
              <SelectValue placeholder="Assigned to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.full_name || m.email || m.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}

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

  return (
    <div className="flex flex-col sm:flex-row gap-tight">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-sm"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[200px] justify-between rounded-sm font-normal">
            <span>{statusTriggerLabel}</span>
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
        <SelectTrigger className="w-full sm:w-[180px] rounded-sm">
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
        <SelectTrigger className="w-full sm:w-[200px] rounded-sm">
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
    </div>
  );
}

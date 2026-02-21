import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { LEAD_STAGES, type LeadStatus } from "@/utils/leadStages";

export const LEAD_STATUS_OPTIONS = LEAD_STAGES;

interface StatusPillProps {
  leadId: string;
  status: LeadStatus;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

export function StatusPill({ leadId, status, onStatusChange }: StatusPillProps) {
  const current = LEAD_STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-body hover:bg-muted transition-colors cursor-pointer"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${current?.color}`} />
          <span className="whitespace-nowrap">{current?.label ?? status}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LEAD_STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(leadId, option.value)}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${option.color}`} />
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

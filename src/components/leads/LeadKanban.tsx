import { useTheme } from "next-themes";
import { EntityKanban } from "@/components/entity-page";
import { LeadCard } from "./LeadCard";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";
import { LEAD_STAGES } from "@/utils/leadStages";
import {
  sortLeads,
  parseSortOption,
  SORT_OPTIONS,
  type SortOption,
} from "@/utils/leadSort";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const statusColumns = LEAD_STAGES.map(({ value, label, color }) => ({
  id: value,
  label,
  color,
}));

interface LeadKanbanProps {
  leads: Lead[];
  /** O(1) lookup by user_id for assignee display */
  membersByUserId?: Map<string, CrmTeamMember>;
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onCreateQuote?: (lead: Lead) => void;
  leadQuotes?: Record<string, Quote>;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
  /** When set, only these status columns are shown */
  selectedStatuses?: string[];
  /** Sort controlled from toolbar */
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
}

export function LeadKanban({
  leads,
  membersByUserId,
  isLoading,
  onEdit,
  onViewLead,
  onStatusChange,
  onCreateQuote,
  leadQuotes = {},
  onViewQuote,
  onUnlinkQuote,
  selectedStatuses,
  sortOption,
  onSortOptionChange,
}: LeadKanbanProps) {
  const { resolvedTheme } = useTheme();
  const variant = resolvedTheme === "dark" ? "stitch-dark" : "default";
  const { field: sortField, direction: sortDirection } = parseSortOption(sortOption);

  const sortOptionsForKanban = SORT_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <EntityKanban<Lead>
      columns={statusColumns}
      items={leads}
      getItemId={(l) => l.id}
      getStatus={(l) => l.status}
      onStatusChange={onStatusChange}
      renderCard={(lead) => (
        <LeadCard
          lead={lead}
          membersByUserId={membersByUserId}
          onEdit={onEdit}
          onViewLead={onViewLead}
          onCreateQuote={onCreateQuote}
          quote={leadQuotes[lead.id]}
          onViewQuote={onViewQuote}
          onUnlinkQuote={onUnlinkQuote}
          variant={variant}
        />
      )}
      selectedColumns={selectedStatuses}
      sortOptions={sortOptionsForKanban}
      sortValue={sortOption}
      onSortChange={(v) => onSortOptionChange(v as SortOption)}
      sortItems={(items) =>
        sortLeads(items, sortField, sortDirection, LEAD_STAGES)
      }
      isLoading={isLoading}
      emptyLabel="No leads"
      variant={variant}
    />
  );
}

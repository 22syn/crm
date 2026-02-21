import { useState } from "react";
import { EntityKanban } from "@/components/entity-page";
import { LeadCard } from "./LeadCard";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";
import { LEAD_STAGES } from "@/utils/leadStages";
import { sortLeads, parseSortOption, type SortOption } from "@/utils/leadSort";

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
  teamMembers?: CrmTeamMember[];
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
  teamMembers = [],
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
  const { field: sortField, direction: sortDirection } = parseSortOption(sortOption);

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
          teamMembers={teamMembers}
          onEdit={onEdit}
          onViewLead={onViewLead}
          onCreateQuote={onCreateQuote}
          quote={leadQuotes[lead.id]}
          onViewQuote={onViewQuote}
          onUnlinkQuote={onUnlinkQuote}
        />
      )}
      selectedColumns={selectedStatuses}
      sortItems={(items) =>
        sortLeads(items, sortField, sortDirection, LEAD_STAGES)
      }
      isLoading={isLoading}
      emptyLabel="No leads"
    />
  );
}

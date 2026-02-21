import type { LeadStageConfig } from "@/utils/leadStages";

export type SortField = "customer_name" | "source" | "status" | "meeting_date" | "created_at" | "days_since_created";
export type SortDirection = "asc" | "desc";

export type SortOption = `${SortField}_${SortDirection}`;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "customer_name_asc", label: "Name A → Z" },
  { value: "customer_name_desc", label: "Name Z → A" },
  { value: "source_asc", label: "Source A → Z" },
  { value: "source_desc", label: "Source Z → A" },
  { value: "status_asc", label: "Status (workflow)" },
  { value: "status_desc", label: "Status (reverse)" },
  { value: "meeting_date_asc", label: "Meeting date (soonest)" },
  { value: "meeting_date_desc", label: "Meeting date (latest)" },
  { value: "created_at_desc", label: "Created (newest first)" },
  { value: "created_at_asc", label: "Created (oldest first)" },
  { value: "days_since_created_asc", label: "Days (lowest first)" },
  { value: "days_since_created_desc", label: "Days (highest first)" },
];

export function parseSortOption(opt: SortOption): { field: SortField; direction: SortDirection } {
  const lastUnderscore = opt.lastIndexOf("_");
  const field = opt.slice(0, lastUnderscore) as SortField;
  const direction = opt.slice(lastUnderscore + 1) as SortDirection;
  return { field, direction };
}

export function toSortOption(field: SortField, direction: SortDirection): SortOption {
  return `${field}_${direction}` as SortOption;
}

export interface LeadLike {
  id: string;
  customer_name: string;
  source: string;
  status: string;
  meeting_date?: string | null;
  created_at: string;
}

export function sortLeads<T extends LeadLike>(
  leads: T[],
  sortField: SortField,
  sortDirection: SortDirection,
  statusOptions: LeadStageConfig[]
): T[] {
  return [...leads].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "customer_name":
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case "source":
        comparison = a.source.localeCompare(b.source);
        break;
      case "status": {
        const aOrder = statusOptions.find((s) => s.value === a.status)?.order ?? 0;
        const bOrder = statusOptions.find((s) => s.value === b.status)?.order ?? 0;
        comparison = aOrder - bOrder;
        break;
      }
      case "meeting_date": {
        const aDate = a.meeting_date ? new Date(a.meeting_date).getTime() : 0;
        const bDate = b.meeting_date ? new Date(b.meeting_date).getTime() : 0;
        comparison = aDate - bDate;
        break;
      }
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "days_since_created": {
        const now = Date.now();
        const aDays = Math.floor((now - new Date(a.created_at).getTime()) / 86400000);
        const bDays = Math.floor((now - new Date(b.created_at).getTime()) / 86400000);
        comparison = aDays - bDays;
        break;
      }
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

import type { Database } from "@/integrations/supabase/types";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];

export interface LeadStageConfig {
  value: LeadStatus;
  label: string;
  color: string;
  order: number;
  /** Terminal/negative state (e.g. Lost) — use muted styling in Kanban. */
  isTerminal?: boolean;
}

export const LEAD_STAGES: LeadStageConfig[] = [
  { value: "new", label: "New", color: "bg-blue-500", order: 0 },
  { value: "in_process", label: "In Process", color: "bg-yellow-500", order: 1 },
  { value: "meeting_scheduled", label: "Meeting Scheduled", color: "bg-teal-500", order: 2 },
  { value: "meeting_done", label: "Meeting Done", color: "bg-sky-500", order: 3 },
  { value: "waiting_for_approval", label: "Waiting for Approval", color: "bg-orange-500", order: 4 },
  { value: "done", label: "Won", color: "bg-green-500", order: 5 },
  { value: "not_done", label: "Lost", color: "bg-red-500", order: 6, isTerminal: true },
];

export function getStageLabel(status: LeadStatus): string {
  return LEAD_STAGES.find((s) => s.value === status)?.label ?? status;
}

export function getStageConfig(status: LeadStatus): LeadStageConfig | undefined {
  return LEAD_STAGES.find((s) => s.value === status);
}

/**
 * Lead scoring and prioritization utilities.
 * Computes hot/warm/cold priority from recency, source quality, and stage.
 */

import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadSource = Lead["source"];
type LeadStatus = Lead["status"];

/** Source quality scores: architects convert better, organic mid, social lower. */
const SOURCE_SCORE: Record<LeadSource, number> = {
  architects: 30,
  website: 25,
  organic: 20,
  instagram: 15,
  facebook: 12,
};

/** Stage progression scores: further along = higher. */
const STAGE_SCORE: Record<LeadStatus, number> = {
  new: 5,
  in_process: 15,
  meeting_scheduled: 35,
  meeting_done: 50,
  waiting_for_approval: 70,
  done: 100,
  not_done: 0,
};

/** Days thresholds for recency. */
const FRESH_DAYS = 3;
const WARM_DAYS = 7;
const STALE_DAYS = 14;

export type LeadPriority = "hot" | "warm" | "cold";
export type StalenessLevel = "fresh" | "aging" | "stale";

/** Compute days since last activity (updated_at or created_at). */
export function getDaysSinceTouch(lead: Lead): number {
  const ts = lead.updated_at || lead.created_at;
  const ms = Date.now() - new Date(ts).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** Staleness level based on days untouched. */
export function getStalenessLevel(lead: Lead): StalenessLevel {
  const days = getDaysSinceTouch(lead);
  if (days <= FRESH_DAYS) return "fresh";
  if (days <= STALE_DAYS) return "aging";
  return "stale";
}

/** Compute lead priority: hot (high urgency), warm, cold. */
export function getLeadPriority(lead: Lead): LeadPriority {
  const days = getDaysSinceTouch(lead);
  const sourceScore = SOURCE_SCORE[lead.source] ?? 15;
  const stageScore = STAGE_SCORE[lead.status] ?? 10;

  // Recency: recent = bonus, stale = penalty
  let recencyBonus = 0;
  if (days <= FRESH_DAYS) recencyBonus = 30;
  else if (days <= WARM_DAYS) recencyBonus = 15;
  else if (days > STALE_DAYS) recencyBonus = -20;

  // Meeting soon = hot
  const meetingSoon =
    lead.meeting_date &&
    lead.status === "meeting_scheduled" &&
    new Date(lead.meeting_date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  const score = sourceScore + stageScore + recencyBonus + (meetingSoon ? 25 : 0);

  if (score >= 70 || meetingSoon) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

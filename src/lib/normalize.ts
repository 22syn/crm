import type { Database } from "@/integrations/supabase/types";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

/**
 * Build Record<key, T> from array using key extractor.
 */
export function arrayToRecord<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K | undefined
): Record<K, T> {
  const out = {} as Record<K, T>;
  for (const item of items) {
    const k = keyFn(item);
    if (k != null) out[k] = item;
  }
  return out;
}

/**
 * Build Record<leadId, Quote> from quotes array. Used for O(1) lookup by lead_id.
 */
export function quotesByLeadId(quotes: Quote[]): Record<string, Quote> {
  return arrayToRecord(quotes, (q) => q.lead_id ?? undefined);
}

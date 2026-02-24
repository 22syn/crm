/**
 * Escapes special ILIKE/LIKE wildcards in PostgreSQL: %, _, and \.
 * Prevents injection when building filter strings for Supabase/PostgREST.
 */
export function escapeIlike(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Migrate data from old Supabase project to new one.
 *
 * Prerequisites:
 * - Old project: Service Role Key (bypasses RLS for full read)
 * - New project: Service Role Key (bypasses RLS for insert)
 *
 * Get keys: Supabase Dashboard → Project Settings → API → service_role (secret)
 *
 * Usage:
 *   OLD_SUPABASE_URL=https://ngmbijlwmnsnncpfnyjg.supabase.co \
 *   OLD_SERVICE_ROLE_KEY=your_old_service_role_key \
 *   NEW_SUPABASE_URL=https://fbtnhhurjwizcrmcisci.supabase.co \
 *   NEW_SERVICE_ROLE_KEY=your_new_service_role_key \
 *   npx tsx scripts/migrate-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SERVICE_ROLE_KEY;

if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error(`
Missing required env vars:
  OLD_SUPABASE_URL       - Old project URL (e.g. https://xxx.supabase.co)
  OLD_SERVICE_ROLE_KEY   - Old project Service Role Key
  NEW_SUPABASE_URL       - New project URL
  NEW_SERVICE_ROLE_KEY   - New project Service Role Key

Get Service Role Key: Dashboard → Project Settings → API → service_role
`);
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

// Migration order: parent tables first (respecting foreign keys)
const TABLES = [
  "customers",
  "suppliers",
  "leads",
  "quotes",
  "quote_items",
  "deals",
  "design_requests",
  "lead_comments",
] as const;

async function migrateTable(table: string) {
  const { data, error } = await oldClient.from(table).select("*");
  if (error) {
    console.warn(`  ⚠ ${table}: ${error.message} (table may not exist or be empty)`);
    return { count: 0, skipped: true };
  }
  if (!data || data.length === 0) {
    console.log(`  ○ ${table}: 0 rows (empty)`);
    return { count: 0 };
  }
  const { error: insertError } = await newClient.from(table).upsert(data, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (insertError) {
    console.error(`  ✗ ${table}: ${insertError.message}`);
    throw insertError;
  }
  console.log(`  ✓ ${table}: ${data.length} rows`);
  return { count: data.length };
}

async function main() {
  console.log("Migrating data...\n");
  let total = 0;
  for (const table of TABLES) {
    const { count } = await migrateTable(table);
    total += count;
  }
  console.log(`\nDone. Migrated ${total} rows across ${TABLES.length} tables.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

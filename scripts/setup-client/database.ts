import type { Client } from "pg";
import type { CompanyModule } from "../../src/lib/branding";
import type { CompanySettingsSeed, MigrationFile, RoleModule } from "./plan";

/** Same table the Supabase CLI writes, so `supabase db push` / `migration list` agree with this script. */
const ENSURE_MIGRATION_TABLE = `
  CREATE SCHEMA IF NOT EXISTS supabase_migrations;
  CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
  );`;

const RECORD_MIGRATION = `
  INSERT INTO supabase_migrations.schema_migrations (version, name, statements, created_by)
  VALUES ($1, $2, $3, 'setup-client')`;

export async function ensureMigrationTable(client: Client): Promise<void> {
  await client.query(ENSURE_MIGRATION_TABLE);
}

export async function fetchAppliedVersions(client: Client): Promise<Set<string>> {
  const { rows } = await client.query<{ version: string }>(
    "SELECT version FROM supabase_migrations.schema_migrations"
  );
  return new Set(rows.map((row) => row.version));
}

async function inTransaction(client: Client, work: () => Promise<void>): Promise<void> {
  await client.query("BEGIN");
  try {
    await work();
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

/** Runs one migration file and records it, all or nothing (like the CLI). */
export async function applyMigration(client: Client, file: MigrationFile, sql: string): Promise<void> {
  await inTransaction(client, async () => {
    await client.query(sql);
    await client.query(RECORD_MIGRATION, [file.version, file.name, [sql]]);
  });
}

/** Marks a seed-only migration as applied without running it. */
export async function recordSkippedMigration(client: Client, file: MigrationFile): Promise<void> {
  await client.query(RECORD_MIGRATION, [file.version, file.name, []]);
}

const UPSERT_COMPANY_SETTINGS = `
  INSERT INTO public.company_settings
    (module, name, logo_url, primary_color, sender_email, address, email, phone, website, features)
  VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, NULL, '{}'::jsonb)
  ON CONFLICT (module) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    sender_email = EXCLUDED.sender_email,
    address = NULL, email = NULL, phone = NULL, website = NULL`;

/**
 * Replaces the demo company rows that `20260311120000_company_settings.sql` seeds with the
 * client's own. Feature flags are left as they are, so a re-run never resets them.
 */
export async function provisionCompanySettings(
  client: Client,
  rows: readonly CompanySettingsSeed[],
  enabledModules: readonly CompanyModule[]
): Promise<void> {
  await inTransaction(client, async () => {
    await client.query("DELETE FROM public.company_settings WHERE NOT (module = ANY($1::text[]))", [
      [...enabledModules],
    ]);
    for (const row of rows) {
      await client.query(UPSERT_COMPANY_SETTINGS, [
        row.module,
        row.name,
        row.logo_url,
        row.primary_color,
        row.sender_email,
      ]);
    }
  });
}

export async function findUserIdByEmail(client: Client, email: string): Promise<string | undefined> {
  const { rows } = await client.query<{ id: string }>(
    "SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );
  return rows[0]?.id;
}

export async function grantAdminRoles(client: Client, userId: string, modules: readonly RoleModule[]): Promise<void> {
  await inTransaction(client, async () => {
    for (const module of modules) {
      await client.query(
        `INSERT INTO public.user_module_roles (user_id, module, role) VALUES ($1, $2, 'admin')
         ON CONFLICT (user_id, module) DO UPDATE SET role = 'admin'`,
        [userId, module]
      );
    }
  });
}

/** Xsheva's own account on the client's project: the only one allowed to change feature flags. */
export async function grantSuperAdmin(client: Client, userId: string): Promise<void> {
  const { rowCount } = await client.query("UPDATE public.profiles SET super_admin = true WHERE user_id = $1", [userId]);
  if (rowCount !== 1) {
    throw new Error("Super admin has no profile row; the on_auth_user_created trigger did not run.");
  }
}

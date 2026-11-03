/**
 * Sets up a NEW client's Supabase project: schema, branding, first admin.
 * Usage and safety notes: scripts/README.md → "Set up a new client".
 *
 *   infisical run -- npm run client:setup -- --name "Acme" --admin-email owner@acme.com --modules leads
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { inviteUser } from "./auth";
import { type ClientConfig, getProjectRef, parseClientArgs, readTargetEnv, type TargetEnv } from "./config";
import {
  applyMigration,
  ensureMigrationTable,
  fetchAppliedVersions,
  findUserIdByEmail,
  grantAdminRoles,
  grantSuperAdmin,
  provisionCompanySettings,
  recordSkippedMigration,
} from "./database";
import {
  buildAdminModules,
  buildCompanySettingsRows,
  buildVercelEnv,
  getMigrationPlan,
  type MigrationStep,
  SEED_ONLY_MIGRATIONS,
} from "./plan";

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations");

const ACTION_LABELS: Readonly<Record<MigrationStep["action"], string>> = {
  apply: "apply",
  "record-only": "SKIP (demo data, recorded only)",
  "already-applied": "already applied",
};

function printPlan(config: ClientConfig, steps: readonly MigrationStep[]): void {
  console.log(`Client: ${config.name} | modules: ${config.modules.join(", ")}`);
  console.log(`Migrations (${steps.length}):`);
  for (const { file, action } of steps) {
    const reason = action === "record-only" ? ` — ${SEED_ONLY_MIGRATIONS.get(file.fileName)}` : "";
    console.log(`  ${ACTION_LABELS[action].padEnd(34)} ${file.fileName}${reason}`);
  }
  console.log("Then: replace demo company rows with the client's branding, invite the first admin");
  console.log(`      (admin of ${buildAdminModules(config.modules).join(", ")})`);
  if (config.superAdminEmail) console.log("      and invite the Xsheva super admin.");
}

async function runMigrations(client: pg.Client, steps: readonly MigrationStep[]): Promise<void> {
  for (const step of steps) {
    if (step.action === "already-applied") continue;
    if (step.action === "record-only") {
      await recordSkippedMigration(client, step.file);
      continue;
    }
    const sql = await readFile(path.join(MIGRATIONS_DIR, step.file.fileName), "utf8");
    try {
      await applyMigration(client, step.file, sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Migration ${step.file.fileName} failed (rolled back; re-run resumes here): ${message}`);
    }
    console.log(`  applied ${step.file.fileName}`);
  }
}

/** Invites the user (or accepts an existing account) and returns their auth user id. */
async function ensureUser(
  client: pg.Client,
  target: TargetEnv,
  email: string,
  redirectTo: string | undefined
): Promise<string> {
  const outcome = await inviteUser(target, email, redirectTo);
  const userId = await findUserIdByEmail(client, email);
  if (!userId) throw new Error("User not found in auth.users after invite.");
  console.log(outcome === "invited" ? "  invite email sent" : "  account already existed; reusing it");
  return userId;
}

async function provisionUsers(client: pg.Client, target: TargetEnv, config: ClientConfig): Promise<void> {
  console.log("First admin:");
  const adminId = await ensureUser(client, target, config.adminEmail, config.siteUrl);
  await grantAdminRoles(client, adminId, buildAdminModules(config.modules));
  if (!config.superAdminEmail) return;

  console.log("Xsheva super admin:");
  const superAdminId = await ensureUser(client, target, config.superAdminEmail, config.siteUrl);
  await grantSuperAdmin(client, superAdminId);
}

function printNextSteps(config: ClientConfig, target: TargetEnv): void {
  const env = buildVercelEnv(config, target.supabaseUrl, getProjectRef(target.supabaseUrl));
  console.log("\nDone. Next, by hand:");
  console.log("1. New Vercel project from this repo, with these env vars:");
  for (const [key, value] of Object.entries(env)) console.log(`     ${key}=${value}`);
  console.log("2. Supabase → Authentication → URL Configuration: set Site URL to the client's address.");
  console.log("3. Deploy edge functions: supabase functions deploy --project-ref <ref>");
}

async function main(): Promise<void> {
  const config = parseClientArgs(process.argv.slice(2));
  const fileNames = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));

  if (config.dryRun) {
    printPlan(config, getMigrationPlan(fileNames, new Set()));
    console.log("\nDry run: nothing was changed.");
    return;
  }

  const target = readTargetEnv(process.env);
  const client = new pg.Client({ connectionString: target.databaseUrl });
  await client.connect();
  try {
    await ensureMigrationTable(client);
    const steps = getMigrationPlan(fileNames, await fetchAppliedVersions(client));
    printPlan(config, steps);
    await runMigrations(client, steps);
    await provisionCompanySettings(client, buildCompanySettingsRows(config), config.modules);
    console.log("Company settings: demo rows replaced with the client's branding.");
    await provisionUsers(client, target, config);
    printNextSteps(config, target);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nSetup failed:\n${message}`);
  process.exitCode = 1;
});

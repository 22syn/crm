import type { CompanyModule } from "../../src/lib/branding";
import type { ClientConfig } from "./config";

/**
 * Migrations that only insert demo data. They are recorded as applied (so `supabase db push`
 * never runs them later) but their SQL is not executed on a client's database.
 * Migrations that touch specific people (Ori, Kobi) stay in: they only act when that user
 * already exists, so on a fresh database they do nothing.
 */
export const SEED_ONLY_MIGRATIONS: ReadonlyMap<string, string> = new Map([
  ["20260221000000_seed_deals_for_dashboard.sql", "demo deals for the dashboard"],
  [
    "20260221100000_seed_admin_and_leads.sql",
    "demo admin user (kobihazout2@gmail.com, placeholder password) and 100 sample leads",
  ],
]);

const MIGRATION_FILE_PATTERN = /^(\d+)_(.+)\.sql$/;

export interface MigrationFile {
  readonly fileName: string;
  readonly version: string;
  readonly name: string;
}

export type MigrationAction = "apply" | "record-only" | "already-applied";

export interface MigrationStep {
  readonly file: MigrationFile;
  readonly action: MigrationAction;
}

export function parseMigrationFileName(fileName: string): MigrationFile | undefined {
  const match = MIGRATION_FILE_PATTERN.exec(fileName);
  return match ? { fileName, version: match[1], name: match[2] } : undefined;
}

/** Orders migrations like the Supabase CLI (by file name) and decides what to do with each. */
export function getMigrationPlan(
  fileNames: readonly string[],
  appliedVersions: ReadonlySet<string>
): MigrationStep[] {
  return [...fileNames]
    .sort()
    .map(parseMigrationFileName)
    .filter((file): file is MigrationFile => file !== undefined)
    .map((file) => ({ file, action: getMigrationAction(file, appliedVersions) }));
}

function getMigrationAction(file: MigrationFile, appliedVersions: ReadonlySet<string>): MigrationAction {
  if (appliedVersions.has(file.version)) return "already-applied";
  return SEED_ONLY_MIGRATIONS.has(file.fileName) ? "record-only" : "apply";
}

export interface CompanySettingsSeed {
  readonly module: CompanyModule;
  readonly name: string;
  readonly logo_url: string | null;
  readonly primary_color: string | null;
  readonly sender_email: string | null;
}

/** One branding row per enabled module; contact fields start empty (the client fills them in Settings). */
export function buildCompanySettingsRows(config: ClientConfig): CompanySettingsSeed[] {
  return config.modules.map((module) => ({
    module,
    name: config.name,
    logo_url: config.logoUrl ?? null,
    primary_color: config.primaryColor ?? null,
    sender_email: config.senderEmail ?? null,
  }));
}

export type RoleModule = CompanyModule | "system";

/** The client's first admin runs every enabled module and the team (system) settings. */
export function buildAdminModules(modules: readonly CompanyModule[]): RoleModule[] {
  return [...modules, "system"];
}

const PUBLISHABLE_KEY_HINT = "<copy from Supabase → Project Settings → API Keys>";

/** Env vars for the client's own Vercel project. Never contains secret values. */
export function buildVercelEnv(
  config: ClientConfig,
  supabaseUrl: string,
  projectRef: string | undefined
): Record<string, string> {
  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_PROJECT_ID: projectRef ?? "<project ref>",
    VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY_HINT,
    // One client per deployment, so the login page can show its branding.
    VITE_BRAND_MODULE: config.modules[0],
  };
}

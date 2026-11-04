import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { parseClientArgs } from "./config";
import {
  buildAdminModules,
  buildCompanySettingsRows,
  buildVercelEnv,
  getMigrationPlan,
  parseMigrationFileName,
  SEED_ONLY_MIGRATIONS,
} from "./plan";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");
const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql"));

describe("parseMigrationFileName", () => {
  it("splits version and name, including short versions", () => {
    expect(parseMigrationFileName("20260311120000_company_settings.sql")).toEqual({
      fileName: "20260311120000_company_settings.sql",
      version: "20260311120000",
      name: "company_settings",
    });
    expect(parseMigrationFileName("20260111_optimize_indices.sql")?.version).toBe("20260111");
    expect(parseMigrationFileName("README.md")).toBeUndefined();
  });
});

describe("getMigrationPlan", () => {
  it("orders by file name, skips seed-only files and resumes after applied ones", () => {
    const plan = getMigrationPlan(
      ["20260221100000_seed_admin_and_leads.sql", "20260111_optimize_indices.sql", "20260110235757_x.sql", "20260311120000_company_settings.sql"],
      new Set(["20260110235757"])
    );
    expect(plan.map((step) => [step.file.version, step.action])).toEqual([
      ["20260110235757", "already-applied"],
      ["20260111", "apply"],
      ["20260221100000", "record-only"],
      ["20260311120000", "apply"],
    ]);
  });
});

describe("repository migrations", () => {
  it("still contains every seed-only migration (a rename would silently run demo data)", () => {
    for (const fileName of SEED_ONLY_MIGRATIONS.keys()) {
      expect(migrationFiles).toContain(fileName);
    }
  });
  it("creates auth users only in seed-only migrations", () => {
    const creatingUsers = migrationFiles.filter((file) =>
      /INSERT\s+INTO\s+auth\.users/i.test(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"))
    );
    expect(creatingUsers.filter((file) => !SEED_ONLY_MIGRATIONS.has(file))).toEqual([]);
  });
});

describe("client rows", () => {
  const config = parseClientArgs([
    "--name", "Acme", "--admin-email", "owner@acme.com", "--modules", "ad_agency,leads", "--primary-color", "#0F766E", "--language", "he",
  ]);

  it("builds one branding row per module with no demo contact details", () => {
    expect(buildCompanySettingsRows(config)).toEqual([
      { module: "ad_agency", name: "Acme", logo_url: null, primary_color: "#0F766E", sender_email: null, language: "he" },
      { module: "leads", name: "Acme", logo_url: null, primary_color: "#0F766E", sender_email: null, language: "he" },
    ]);
  });
  it("makes the first admin an admin of each module plus system", () => {
    expect(buildAdminModules(config.modules)).toEqual(["ad_agency", "leads", "system"]);
  });
  it("prints Vercel env vars without secrets and brands the login page", () => {
    const env = buildVercelEnv(config, "https://abcd.supabase.co", "abcd");
    expect(env).toMatchObject({
      VITE_SUPABASE_URL: "https://abcd.supabase.co",
      VITE_SUPABASE_PROJECT_ID: "abcd",
      VITE_BRAND_MODULE: "ad_agency",
    });
    expect(env.VITE_SUPABASE_PUBLISHABLE_KEY).toMatch(/^<.*>$/);
  });
});

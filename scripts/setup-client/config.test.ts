import { describe, it, expect } from "vitest";
import { DEMO_PROJECT_REF, getProjectRef, parseClientArgs, readTargetEnv } from "./config";

const BASE_ARGS = ["--name", "Acme Furniture", "--admin-email", "Owner@Acme.com", "--modules", "leads"];

describe("parseClientArgs", () => {
  it("parses a minimal valid command", () => {
    expect(parseClientArgs(BASE_ARGS)).toEqual({
      name: "Acme Furniture",
      adminEmail: "owner@acme.com",
      modules: ["leads"],
      logoUrl: undefined,
      primaryColor: undefined,
      senderEmail: undefined,
      superAdminEmail: undefined,
      siteUrl: undefined,
      dryRun: false,
    });
  });
  it("parses every option and dedupes modules", () => {
    const config = parseClientArgs([
      ...BASE_ARGS.slice(0, 4),
      "--modules", "leads, ad_agency,leads",
      "--logo-url", "https://cdn.acme.com/logo.png",
      "--primary-color", "#0F766E",
      "--sender-email", "quotes@acme.com",
      "--super-admin-email", "Kobi@Xsheva.com",
      "--site-url", "https://crm.acme.com",
      "--dry-run",
    ]);
    expect(config.modules).toEqual(["leads", "ad_agency"]);
    expect(config.superAdminEmail).toBe("kobi@xsheva.com");
    expect(config.dryRun).toBe(true);
  });
  it("lists every problem at once", () => {
    expect(() => parseClientArgs(["--modules", "crm"])).toThrow(/--name is required[\s\S]*--admin-email[\s\S]*/);
  });
  it("rejects unsafe or malformed branding", () => {
    expect(() => parseClientArgs([...BASE_ARGS, "--logo-url", "javascript:alert(1)"])).toThrow("--logo-url");
    expect(() => parseClientArgs([...BASE_ARGS, "--primary-color", "teal"])).toThrow("--primary-color");
    expect(() => parseClientArgs([...BASE_ARGS, "--site-url", "http://crm.acme.com"])).toThrow("--site-url");
  });
  it("rejects unknown flags", () => {
    expect(() => parseClientArgs([...BASE_ARGS, "--password", "x"])).toThrow();
  });
});

describe("readTargetEnv", () => {
  const env = {
    DATABASE_URL: "postgres://postgres:pw@db.abcd.supabase.co:5432/postgres",
    SUPABASE_URL: "https://abcd.supabase.co/",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  };
  it("reads and trims the target", () => {
    expect(readTargetEnv(env)).toEqual({
      databaseUrl: env.DATABASE_URL,
      supabaseUrl: "https://abcd.supabase.co",
      serviceRoleKey: "service-key",
    });
  });
  it("names every missing variable", () => {
    expect(() => readTargetEnv({})).toThrow("DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  });
  it("refuses the shared demo project", () => {
    expect(() => readTargetEnv({ ...env, SUPABASE_URL: `https://${DEMO_PROJECT_REF}.supabase.co` })).toThrow("demo project");
    expect(() =>
      readTargetEnv({ ...env, DATABASE_URL: `postgres://postgres.${DEMO_PROJECT_REF}:pw@pooler:5432/postgres` })
    ).toThrow("demo project");
  });
  it("allows plain http only for localhost", () => {
    expect(readTargetEnv({ ...env, SUPABASE_URL: "http://localhost:54400" }).supabaseUrl).toBe("http://localhost:54400");
    expect(() => readTargetEnv({ ...env, SUPABASE_URL: "http://abcd.supabase.co" })).toThrow("https://");
  });
});

describe("getProjectRef", () => {
  it("extracts the ref from a Supabase URL", () => {
    expect(getProjectRef("https://abcd123.supabase.co")).toBe("abcd123");
    expect(getProjectRef("http://localhost:54400")).toBeUndefined();
  });
});

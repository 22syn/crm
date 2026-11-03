import { parseArgs } from "node:util";
import { z } from "zod";
import { COMPANY_MODULES, isSafeLogoUrl, isValidHexColor } from "../../src/lib/branding";

/** The shared Xsheva demo project. Real clients never go there. */
export const DEMO_PROJECT_REF = "fbtnhhurjwizcrmcisci";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const MAX_NAME_LENGTH = 100;

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const clientConfigSchema = z.object({
  name: z.string().trim().min(1, "--name is required").max(MAX_NAME_LENGTH),
  adminEmail: z.string().trim().toLowerCase().email("--admin-email must be an email"),
  modules: z
    .array(z.enum(COMPANY_MODULES))
    .min(1, `--modules must list at least one of: ${COMPANY_MODULES.join(", ")}`)
    .transform((modules) => [...new Set(modules)]),
  logoUrl: optionalText.refine((v) => v === undefined || isSafeLogoUrl(v), "--logo-url must start with https:// or /"),
  primaryColor: optionalText.refine((v) => v === undefined || isValidHexColor(v), "--primary-color must look like #1337EC"),
  senderEmail: optionalText.refine((v) => v === undefined || z.string().email().safeParse(v).success, "--sender-email must be an email"),
  superAdminEmail: optionalText
    .transform((v) => v?.toLowerCase())
    .refine((v) => v === undefined || z.string().email().safeParse(v).success, "--super-admin-email must be an email"),
  siteUrl: optionalText.refine((v) => v === undefined || v.startsWith("https://"), "--site-url must start with https://"),
  dryRun: z.boolean(),
});

export type ClientConfig = z.infer<typeof clientConfigSchema>;

const CLI_OPTIONS = {
  name: { type: "string" },
  "admin-email": { type: "string" },
  modules: { type: "string" },
  "logo-url": { type: "string" },
  "primary-color": { type: "string" },
  "sender-email": { type: "string" },
  "super-admin-email": { type: "string" },
  "site-url": { type: "string" },
  "dry-run": { type: "boolean", default: false },
} as const;

/** Parses CLI flags into a validated config. Throws with every problem listed. */
export function parseClientArgs(argv: readonly string[]): ClientConfig {
  const { values } = parseArgs({ args: [...argv], options: CLI_OPTIONS, strict: true });
  const result = clientConfigSchema.safeParse({
    name: values.name ?? "",
    adminEmail: values["admin-email"] ?? "",
    modules: (values.modules ?? "").split(",").map((m) => m.trim()).filter(Boolean),
    logoUrl: values["logo-url"],
    primaryColor: values["primary-color"],
    senderEmail: values["sender-email"],
    superAdminEmail: values["super-admin-email"],
    siteUrl: values["site-url"],
    dryRun: values["dry-run"] ?? false,
  });
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => `- ${issue.message}`).join("\n"));
  }
  return result.data;
}

export interface TargetEnv {
  readonly databaseUrl: string;
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
}

const REQUIRED_ENV = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

/** Reads the new client's connection settings and refuses the shared demo project. */
export function readTargetEnv(env: Readonly<Record<string, string | undefined>>): TargetEnv {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
  const target = {
    databaseUrl: env.DATABASE_URL!.trim(), // Safe: checked for missing values above.
    supabaseUrl: env.SUPABASE_URL!.trim().replace(/\/+$/, ""),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  };
  if (target.databaseUrl.includes(DEMO_PROJECT_REF) || target.supabaseUrl.includes(DEMO_PROJECT_REF)) {
    throw new Error(`Refusing to run against the shared demo project (${DEMO_PROJECT_REF}).`);
  }
  if (!isAllowedSupabaseUrl(target.supabaseUrl)) {
    throw new Error("SUPABASE_URL must be https:// (http:// is allowed only for localhost).");
  }
  return target;
}

function isAllowedSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname));
  } catch {
    return false;
  }
}

/** "https://abcd.supabase.co" → "abcd"; undefined for anything else (e.g. a local stub). */
export function getProjectRef(supabaseUrl: string): string | undefined {
  return /^https:\/\/([a-z0-9]+)\.supabase\.co$/.exec(supabaseUrl)?.[1];
}

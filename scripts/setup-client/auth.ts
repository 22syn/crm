import { createClient } from "@supabase/supabase-js";
import type { TargetEnv } from "./config";

export type InviteOutcome = "invited" | "already-registered";

const ALREADY_REGISTERED_CODES = new Set(["email_exists", "user_already_exists"]);

/**
 * Sends a Supabase invite email (the user sets their own password).
 * An address that is already registered is fine: a re-run must not fail on it.
 */
export async function inviteUser(
  target: TargetEnv,
  email: string,
  redirectTo: string | undefined
): Promise<InviteOutcome> {
  const admin = createClient(target.supabaseUrl, target.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.inviteUserByEmail(email, redirectTo ? { redirectTo } : undefined);
  if (!error) return "invited";
  if (error.code && ALREADY_REGISTERED_CODES.has(error.code)) return "already-registered";
  throw new Error(`Invite failed: ${error.message}`);
}

/**
 * Reset password for kobihazout2@gmail.com using Supabase Admin API.
 * Run: SUPABASE_URL="https://fbtnhhurjwizcrmcisci.supabase.co" SERVICE_ROLE_KEY="your_service_role_key" node scripts/fix-admin-password.js
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "https://fbtnhhurjwizcrmcisci.supabase.co";
const key = process.env.SERVICE_ROLE_KEY;
if (!key) {
  console.error("Missing SERVICE_ROLE_KEY. Get it from: Dashboard → Project Settings → API → service_role");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const email = "kobihazout2@gmail.com";
const newPassword = "K5991322h";

const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) {
  console.error("Failed to list users:", listErr.message);
  process.exit(1);
}

const user = users?.find((u) => u.email === email);
if (!user) {
  console.error(`User ${email} not found. Run seed:run first.`);
  process.exit(1);
}

const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
if (updateErr) {
  console.error("Failed to update password:", updateErr.message);
  process.exit(1);
}

console.log(`Password updated for ${email}. You can now sign in with: ${email} / ${newPassword}`);

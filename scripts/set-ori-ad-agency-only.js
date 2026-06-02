/**
 * Restrict ori@harsinai.co.il to ad_agency (משרד פרסום) only.
 * Run: node --env-file=.env.local scripts/set-ori-ad-agency-only.js
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://fbtnhhurjwizcrmcisci.supabase.co";
const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("Missing SERVICE_ROLE_KEY. Add to .env.local or pass as env var.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const EMAIL = "ori@harsinai.co.il";

// Get user_id from profiles
const { data: profile, error: profileErr } = await supabase
  .from("profiles")
  .select("user_id")
  .eq("email", EMAIL)
  .maybeSingle();

if (profileErr || !profile) {
  console.error("User not found:", EMAIL, profileErr?.message);
  process.exit(1);
}

const userId = profile.user_id;

// Delete all module roles for this user
const { error: delErr } = await supabase.from("user_module_roles").delete().eq("user_id", userId);
if (delErr) {
  console.error("Failed to delete module roles:", delErr.message);
  process.exit(1);
}

// Insert only ad_agency
const { error: insErr } = await supabase.from("user_module_roles").insert({
  user_id: userId,
  module: "ad_agency",
  role: "user",
});
if (insErr) {
  console.error("Failed to add ad_agency:", insErr.message);
  process.exit(1);
}

// Remove from user_roles (legacy)
await supabase.from("user_roles").delete().eq("user_id", userId);

console.log(`✓ ${EMAIL} is now restricted to משרד פרסום (ad_agency) only.`);

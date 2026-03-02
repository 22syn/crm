/**
 * Add users with ad_agency (משרד פרסום) permissions.
 * Reads users from ADD_AGENCY_USERS env as JSON array: [{"email":"...","password":"..."}]
 *
 * Run: ADD_AGENCY_USERS='[{"email":"a@b.com","password":"..."}]' node --env-file=.env scripts/add-ad-agency-users.js
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://fbtnhhurjwizcrmcisci.supabase.co";
const key = process.env.SERVICE_ROLE_KEY;

if (!key) {
  console.error("Missing SERVICE_ROLE_KEY. Add to .env: SERVICE_ROLE_KEY=your_key");
  process.exit(1);
}

const usersJson = process.env.ADD_AGENCY_USERS;
if (!usersJson) {
  console.error(
    "Missing ADD_AGENCY_USERS. Set as JSON array: ADD_AGENCY_USERS='[{\"email\":\"a@b.com\",\"password\":\"...\"}]'"
  );
  process.exit(1);
}

let users;
try {
  users = JSON.parse(usersJson);
  if (!Array.isArray(users) || users.some((u) => !u?.email || !u?.password)) {
    throw new Error("Invalid format");
  }
} catch {
  console.error("ADD_AGENCY_USERS must be a JSON array of {email, password} objects");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const MODULE = "ad_agency";
const ROLE = "user";

async function ensureUser(email, password) {
  const { data: { users: list } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`User ${email} already exists. Updating password...`);
    const { error: pwdErr } = await supabase.auth.admin.updateUserById(userId, { password });
    if (pwdErr) console.error(`  Warning: could not update password: ${pwdErr.message}`);
    else console.log(`  Password set to email.`);
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error(`Failed to create ${email}:`, error.message);
      return null;
    }
    userId = newUser.user.id;
    console.log(`Created user ${email}.`);
  }

  // Ensure only ad_agency: remove other modules, then upsert
  await supabase.from("user_module_roles").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("user_module_roles")
    .upsert({ user_id: userId, module: MODULE, role: ROLE }, { onConflict: "user_id,module" });

  if (error && error.code !== "23505") {
    console.error(`Failed to add role for ${email}:`, error.message);
    return null;
  }
  console.log(`✓ ${email} has ad_agency (משרד פרסום) access.`);
  return userId;
}

for (const { email, password } of users) {
  await ensureUser(email, password);
}
console.log("\nDone.");

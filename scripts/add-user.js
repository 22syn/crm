/**
 * Add a user to the CRM with a role. Creates the user in Supabase Auth and adds them to user_roles.
 *
 * Option A - Invite (user sets their own password via email):
 *   USER_EMAIL=ori@harsinai.co.il USER_ROLE=sales npm run user:add
 *
 * Option B - Create with password (you share the password with the user):
 *   USER_EMAIL=ori@harsinai.co.il USER_PASSWORD=TempPass123! USER_ROLE=sales npm run user:add
 *
 * SERVICE_ROLE_KEY can be in .env (loaded via --env-file) or passed as env var.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://fbtnhhurjwizcrmcisci.supabase.co";
const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = process.env.USER_EMAIL;
const password = process.env.USER_PASSWORD;
const role = (process.env.USER_ROLE || "sales") === "admin" ? "admin" : "sales";

if (!key) {
  console.error("Missing SERVICE_ROLE_KEY. Get it from: Dashboard → Project Settings → API → service_role");
  process.exit(1);
}
if (!email) {
  console.error("Missing USER_EMAIL. Run: USER_EMAIL=user@example.com USER_ROLE=sales node scripts/add-user.js");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Check if user already exists
const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
const existing = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

let userId;
if (existing) {
  userId = existing.id;
  if (password) {
    const { error: pwdErr } = await supabase.auth.admin.updateUserById(userId, { password });
    if (pwdErr) {
      console.error("Failed to update password:", pwdErr.message);
      process.exit(1);
    }
    console.log(`User ${email} already exists. Password updated.`);
  } else {
    console.log(`User ${email} already exists. Adding role...`);
  }
} else if (password) {
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    console.error("Failed to create user:", createErr.message);
    process.exit(1);
  }
  userId = newUser.user.id;
  console.log(`User created. Share this password with ${email}: ${password}`);
} else {
  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
  });
  if (inviteErr) {
    console.error("Failed to invite:", inviteErr.message);
    process.exit(1);
  }
  userId = invited.user.id;
  console.log(`Invitation sent to ${email}. They will receive an email to set their password.`);
}

// Add to user_roles (service role bypasses RLS)
const { error: roleErr } = await supabase.from("user_roles").insert({
  user_id: userId,
  role,
});

// 23505 = unique_violation - user already has this role
if (roleErr && roleErr.code !== "23505") {
  console.error("Failed to add role:", roleErr.message);
  process.exit(1);
}

console.log(`✓ ${email} has been granted ${role} access.`);

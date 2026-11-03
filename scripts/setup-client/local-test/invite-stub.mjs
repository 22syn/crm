// Fake Supabase Auth invite endpoint for local testing: creates the user row in the local
// auth.users table (which fires the app's on_auth_user_created trigger) instead of emailing.
// Usage: DATABASE_URL=... node scripts/setup-client/local-test/invite-stub.mjs <port>
import http from "node:http";
import pg from "pg";

const port = Number(process.argv[2] ?? 54400);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleInvite(req, res) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const { email } = JSON.parse(raw);
  const existing = await pool.query("SELECT id FROM auth.users WHERE lower(email) = lower($1)", [email]);
  if (existing.rowCount > 0) {
    return send(res, 422, { code: 422, error_code: "email_exists", msg: "A user with this email address has already been registered" });
  }
  const { rows } = await pool.query(
    "INSERT INTO auth.users (email, aud, role, invited_at) VALUES ($1, 'authenticated', 'authenticated', now()) RETURNING id, email, aud, role",
    [email]
  );
  return send(res, 200, { ...rows[0], app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
}

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/auth/v1/invite")) {
      handleInvite(req, res).catch((error) => send(res, 500, { msg: String(error) }));
      return;
    }
    send(res, 404, { msg: "not found" });
  })
  .listen(port, () => console.log(`invite stub on http://localhost:${port}`));

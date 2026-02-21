/**
 * Run seed migration (admin user + 100 leads) via DB connection.
 * Pooler host is in supabase/.temp/pooler-url (use aws-1 not aws-0 for Frankfurt).
 * Full: postgres://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../supabase/migrations/20260221100000_seed_admin_and_leads.sql"),
  "utf8"
);

let url = process.env.DATABASE_URL;
if (!url && process.env.DB_PASSWORD) {
  const poolerPath = join(process.cwd(), "supabase", ".temp", "pooler-url");
  if (existsSync(poolerPath)) {
    const pooler = readFileSync(poolerPath, "utf8").trim();
    url = pooler.replace("@", `:${process.env.DB_PASSWORD}@`);
  }
}
if (!url) {
  console.error("Missing DATABASE_URL or DB_PASSWORD. Examples:");
  console.error('  DB_PASSWORD=yourpass npm run seed:run');
  console.error('  DATABASE_URL="postgres://postgres.fbtnhhurjwizcrmcisci:PASS@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" npm run seed:run');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Done. User kobihazout2@gmail.com created (admin) + 100 leads.");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

/**
 * Fix 500 login error: set NULL token columns + reset password for kobihazout2@gmail.com
 * Run: DB_PASSWORD=yourpass npm run seed:fix-auth
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "fix-password.sql"), "utf8");

let url = process.env.DATABASE_URL;
if (!url && process.env.DB_PASSWORD) {
  const poolerPath = join(process.cwd(), "supabase", ".temp", "pooler-url");
  if (existsSync(poolerPath)) {
    const pooler = readFileSync(poolerPath, "utf8").trim();
    url = pooler.replace("@", `:${process.env.DB_PASSWORD}@`);
  }
}
if (!url) {
  console.error("Missing DB_PASSWORD. Run: DB_PASSWORD=yourpass npm run seed:fix-auth");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Fixed. Try login with kobihazout2@gmail.com / K5991322h");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

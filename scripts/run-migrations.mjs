import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env"));

const url = process.env.VITE_SUPABASE_URL?.trim();
const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ||
  (process.env.SUPABASE_DB_PASSWORD?.trim() && url
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD.trim())}@db.${new URL(url).hostname.split(".")[0]}.supabase.co:5432/postgres`
    : "");
if (!dbUrl) {
  console.error(
    "SUPABASE_DB_URL is not set.\n" +
      "Add it to .env from Supabase Dashboard → Project Settings → Database → Connection string (URI).\n" +
      "Then run: npm run db:migrate",
  );
  process.exit(1);
}

const migrationsDir = path.join(root, "supabase", "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Connected. Applying ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    await client.query(sql);
  }

  console.log("Migrations applied successfully.");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}

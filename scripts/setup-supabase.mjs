/**
 * EliteStay Supabase one-shot setup.
 * Reads credentials from .env (never hardcodes keys in source).
 *
 * Required in .env:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   SUPABASE_DB_URL          — Postgres URI for migrations
 *
 * Optional:
 *   SUPABASE_SERVICE_ROLE_KEY — creates first admin via Auth Admin API
 *   ADMIN_EMAIL / ADMIN_PASSWORD — default admin@elitestay.com / EliteStay@2026!
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ||
  (process.env.SUPABASE_DB_PASSWORD?.trim() && url
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD.trim())}@db.fuzxpxmmrhgdntxnaddq.supabase.co:5432/postgres`
    : "");
const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@elitestay.com";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "EliteStay@2026!";

function isPlaceholder(u, k) {
  return (
    !u ||
    !k ||
    u.includes("your-project") ||
    k === "your-anon-key" ||
    k.includes("your-anon") ||
    !k.startsWith("eyJ")
  );
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

console.log("EliteStay Supabase setup\n");

if (isPlaceholder(url, anonKey)) {
  fail(
    "VITE_SUPABASE_ANON_KEY is missing or still a placeholder.\n" +
      "  Supabase Dashboard → Project Settings → API → anon public key → paste into .env",
  );
}

if (!dbUrl || dbUrl.includes("[password]") || dbUrl.includes("your-")) {
  fail(
    "SUPABASE_DB_URL is missing.\n" +
      "  Dashboard → Project Settings → Database → Connection string (URI) → paste into .env",
  );
}

const migrationsDir = path.join(root, "supabase", "migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const pgClient = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await pgClient.connect();
  console.log(`✓ Connected to database`);

  for (const file of migrationFiles) {
    console.log(`→ Applying ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pgClient.query(sql);
  }
  console.log("✓ Migrations applied");

  if (serviceKey && !serviceKey.includes("your-service")) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());

    if (!found) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "System Administrator", role: "ADMIN" },
      });
      if (createErr) fail(`Admin user creation failed: ${createErr.message}`);
      console.log(`✓ Created admin auth user: ${adminEmail}`);
      if (created?.user?.id) {
        await pgClient.query(
          `UPDATE public.profiles SET role = 'ADMIN', status = 'ACTIVE', full_name = 'System Administrator', position = 'General Manager', approved_at = now() WHERE id = $1`,
          [created.user.id],
        );
      }
    } else {
      await pgClient.query(
        `UPDATE public.profiles SET role = 'ADMIN', status = 'ACTIVE', full_name = 'System Administrator', position = 'General Manager', approved_at = now() WHERE id = $1`,
        [found.id],
      );
      console.log(`✓ Promoted existing user to ADMIN: ${adminEmail}`);
    }

    await pgClient.query(
      `INSERT INTO public.staff_users (profile_id, employee_code, department, notes)
       SELECT id, 'ADM-001', 'Management', 'Initial system administrator'
       FROM public.profiles WHERE lower(email) = lower($1)
       ON CONFLICT (profile_id) DO UPDATE SET employee_code = EXCLUDED.employee_code, updated_at = now()`,
      [adminEmail],
    );
    console.log("✓ staff_users row ensured");
  } else {
    console.log("⚠ SUPABASE_SERVICE_ROLE_KEY not set — skip auto admin. Run supabase/seed/001_first_admin.sql manually.");
  }
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  await pgClient.end();
}

const supabase = createClient(url, anonKey);
const tables = [
  "profiles",
  "room_types",
  "rooms",
  "guests",
  "bookings",
  "payments",
  "staff_users",
  "contact_messages",
  "activity_logs",
  "hotel_settings",
];

for (const table of tables) {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
  if (error) fail(`Table "${table}": ${error.message}`);
  console.log(`✓ Table "${table}" accessible`);
}

console.log("\n✓ Setup complete.");
if (serviceKey && !serviceKey.includes("your-service")) {
  console.log(`\nAdmin login: ${adminEmail} / ${adminPassword}`);
  console.log("Change the password after first sign-in.");
}

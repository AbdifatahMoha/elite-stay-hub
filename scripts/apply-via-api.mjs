/**
 * Apply migrations using Supabase service role + Postgres pooler.
 * Requires SUPABASE_DB_URL in .env (database password from dashboard).
 * Falls back to reporting what's needed if only API keys are set.
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@elitestay.com";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "EliteStay@2026!";

async function runMigrationsWithPg() {
  const migrationsDir = path.join(root, "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  for (const file of files) {
    console.log(`→ ${file}`);
    await client.query(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
  }
  await client.end();
  console.log("✓ Migrations applied via Postgres");
}

async function createAdmin() {
  if (!url || !serviceKey) return;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let userId = list?.users?.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "System Administrator", role: "ADMIN" },
    });
    if (error) throw error;
    userId = data.user?.id;
    console.log(`✓ Created admin user: ${adminEmail}`);
  } else {
    console.log(`✓ Admin auth user exists: ${adminEmail}`);
  }

  if (!userId) throw new Error("Admin user id missing");

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    email: adminEmail,
    full_name: "System Administrator",
    role: "ADMIN",
    status: "ACTIVE",
    position: "General Manager",
    approved_at: new Date().toISOString(),
  });
  if (profileErr) throw profileErr;

  await admin.from("staff_users").upsert(
    {
      profile_id: userId,
      employee_code: "ADM-001",
      department: "Management",
      notes: "Initial system administrator",
    },
    { onConflict: "profile_id" },
  );

  console.log("✓ Admin profile promoted");
  console.log(`  Login: ${adminEmail} / ${adminPassword}`);
}

async function main() {
  console.log("EliteStay migration + admin setup\n");

  if (dbUrl) {
    await runMigrationsWithPg();
  } else {
    console.log("⚠ SUPABASE_DB_URL not set — skipping SQL migrations.");
    console.log("  Add database URI to .env, or run SQL files in Supabase SQL Editor.");
    const { data, error } = await createClient(url, process.env.VITE_SUPABASE_ANON_KEY).from("hotel_settings").select("id").limit(1);
    if (error?.message?.includes("Could not find the table")) {
      console.error("\n✗ Tables not found. Migrations must be applied before admin setup.");
      process.exit(1);
    }
  }

  await createAdmin();
  console.log("\nDone. Run: npm run db:verify");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});

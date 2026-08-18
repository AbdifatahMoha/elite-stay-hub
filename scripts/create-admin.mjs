/** Create/promote first admin via Supabase Auth Admin API (requires migrations applied). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@elitestay.com";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "EliteStay@2026!";

if (!url || !serviceKey || serviceKey.includes("your-service")) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: tableErr } = await admin.from("profiles").select("id").limit(1);
if (tableErr?.message?.includes("Could not find the table")) {
  console.error("profiles table missing — run supabase/apply-all.sql in SQL Editor first.");
  process.exit(1);
}

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
  console.log(`Created auth user: ${adminEmail}`);
} else {
  console.log(`Auth user exists: ${adminEmail}`);
}

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

console.log("Admin ready.");
console.log(`  Email: ${adminEmail}`);
console.log(`  Password: ${adminPassword}`);

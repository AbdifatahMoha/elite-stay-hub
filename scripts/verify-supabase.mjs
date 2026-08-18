import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

function isPlaceholder(u, k) {
  return !u || !k || u.includes("your-project") || k === "your-anon-key" || k.includes("your-anon");
}

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

console.log("EliteStay Supabase verification\n");

if (isPlaceholder(url, anonKey)) {
  console.error("✗ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or still a placeholder.");
  console.error("  Update .env with values from Supabase Dashboard → Project Settings → API.");
  process.exit(1);
}

console.log(`✓ Env configured (${url})`);

const supabase = createClient(url, anonKey);

const { data: settings, error: settingsError } = await supabase
  .from("hotel_settings")
  .select("hotel_name")
  .limit(1)
  .maybeSingle();

if (settingsError) {
  console.error("✗ Cannot query hotel_settings:", settingsError.message);
  console.error("  Run migrations: npm run db:migrate (requires SUPABASE_DB_URL in .env)");
  process.exit(1);
}

console.log(`✓ Database reachable (hotel: ${settings?.hotel_name ?? "EliteStay Hotel"})`);

let missing = 0;
for (const table of tables) {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
  if (error) {
    console.error(`✗ Table "${table}": ${error.message}`);
    missing += 1;
  } else {
    console.log(`✓ Table "${table}"`);
  }
}

if (missing) {
  console.error(`\n${missing} table(s) missing or inaccessible. Apply migrations in supabase/migrations/.`);
  process.exit(1);
}

console.log("\nAll checks passed.");

/**
 * Production entry for Railway / Node.
 * Nitro's node-server preset emits `.output/server/index.mjs` (not dist/server/server.js).
 * It reads PORT / NITRO_PORT; default host is all interfaces only when HOST is unset,
 * so we bind 0.0.0.0 explicitly for Railway's proxy.
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

process.env.HOST ??= "0.0.0.0";

const serverEntry = resolve(process.cwd(), ".output/server/index.mjs");
if (!existsSync(serverEntry)) {
  console.error(
    `Missing production server at ${serverEntry}. Run "npm run build" first.`,
  );
  process.exit(1);
}

await import(pathToFileURL(serverEntry).href);

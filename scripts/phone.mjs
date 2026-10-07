#!/usr/bin/env node
/**
 * Try the site from a phone on the same Wi-Fi (npm run phone).
 *
 * Phones only allow the microphone on HTTPS pages, so this starts the site in
 * development mode with a local HTTPS certificate, listening on your network.
 * The phone will warn that the certificate isn't trusted: that's expected for a
 * private test (choose "Advanced" → "Proceed"). Stop with Ctrl+C.
 * The local database must already be running (start the site normally once first).
 */
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ip =
  Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === "IPv4" && !i.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(i.address))?.address ?? null;

if (!ip) {
  console.error("\n  ✗ Couldn't find this computer's Wi-Fi address. Are you connected to a network?\n");
  process.exit(1);
}

const url = `https://${ip}:3000`;
console.log(`\n  On your phone (same Wi-Fi), open:  ${url}`);
console.log(`  Admin: ${url}/admin  (the login link arrives in the local inbox on this computer)\n`);

const next = join(ROOT, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "dev", "--experimental-https", "-H", "0.0.0.0", "-p", "3000"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, SITE_URL: url },
});
child.on("exit", (code) => process.exit(code ?? 0));

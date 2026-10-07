#!/usr/bin/env node
// Runs the daily maintenance job against the running site (npm run maintenance).
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const res = await fetch(`${env.SITE_URL ?? "http://localhost:3000"}/api/cron/daily`, {
  headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
}).catch(() => null);
if (!res) {
  console.error("The site isn't running. Start it first.");
  process.exit(1);
}
console.log(res.status, JSON.stringify(await res.json(), null, 2));

#!/usr/bin/env node
/**
 * Beyond Listening — local backup and restore (macOS, Windows, Linux).
 *
 *   npm run backup                  → backups/<date-time>/ (database data + every stored file)
 *   npm run restore                 → lists available backups
 *   npm run restore -- <folder>     → REPLACES the current local data with that backup
 *
 * The site and the local database must be running (use "Start Beyond Listening").
 * Backups contain personal data (contributor emails, voice recordings): keep them safe.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BACKUPS = join(ROOT, "backups");
const isWin = process.platform === "win32";
const BUCKETS = ["audio-incoming", "audio-published", "covers"];
const DB_CONTAINER = "supabase_db_beyond-listening";

const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "";
process.env.PATH = [
  process.env.PATH,
  ...(isWin
    ? [
        join(process.env.ProgramFiles ?? "C:\\Program Files", "Docker", "Docker", "resources", "bin"),
        join(process.env.LOCALAPPDATA ?? "", "Programs", "DockerDesktop", "resources", "bin"),
      ]
    : ["/usr/local/bin", "/opt/homebrew/bin", "/Applications/Docker.app/Contents/Resources/bin", join(HOME, ".docker", "bin")]),
].join(isWin ? ";" : ":");

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function readEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) fail("No settings found. Start the site once with 'Start Beyond Listening' first.");
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

const env = readEnv();
const API = env.NEXT_PUBLIC_SUPABASE_URL;
const auth = { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
const supabaseBin = join(ROOT, "node_modules", ".bin", isWin ? "supabase.cmd" : "supabase");

function run(command, args, { input } = {}) {
  const res = spawnSync(isWin && command.endsWith(".cmd") ? `"${command}"` : command, args, {
    cwd: ROOT,
    encoding: "utf8",
    input,
    shell: isWin && command.endsWith(".cmd"),
    maxBuffer: 1024 * 1024 * 512,
  });
  return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

async function databaseReachable() {
  try {
    const res = await fetch(`${API}/auth/v1/health`, { headers: auth, signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Lists every object in a bucket (folders are walked recursively). */
async function listObjects(bucket, prefix = "") {
  const res = await fetch(`${API}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  if (!res.ok) return [];
  const out = [];
  for (const item of await res.json()) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) out.push(path);
    else out.push(...(await listObjects(bucket, path)));
  }
  return out;
}

async function backup() {
  if (!(await databaseReachable())) fail("The local database isn't running. Start the site first.");
  const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  const dir = join(BACKUPS, stamp);
  mkdirSync(join(dir, "storage"), { recursive: true });

  console.log("\n  Beyond Listening — backup\n");
  console.log("  Saving the database…");
  const dump = run(supabaseBin, ["db", "dump", "--local", "--data-only", "--schema", "public,auth", "-f", join(dir, "data.sql")]);
  if (dump.code !== 0) fail(`The database dump failed:\n${dump.stderr}`);

  let files = 0;
  for (const bucket of BUCKETS) {
    for (const path of await listObjects(bucket)) {
      const res = await fetch(`${API}/storage/v1/object/${bucket}/${path}`, { headers: auth });
      if (!res.ok) continue;
      const target = join(dir, "storage", bucket, ...path.split("/"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      files += 1;
    }
  }
  writeFileSync(
    join(dir, "README.txt"),
    `Beyond Listening backup, ${new Date().toString()}\n` +
      `Contains personal data (contributor emails, voice recordings): keep it safe.\n` +
      `Restore with:  npm run restore -- ${stamp}\n`,
  );
  console.log(`  ✓ Saved the database and ${files} file${files === 1 ? "" : "s"} to backups/${stamp}\n`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

async function restore(name) {
  const available = existsSync(BACKUPS) ? readdirSync(BACKUPS).filter((d) => existsSync(join(BACKUPS, d, "data.sql"))).sort() : [];
  if (!name) {
    console.log(available.length ? `\n  Available backups:\n${available.map((b) => `    ${b}`).join("\n")}\n\n  Restore one with:  npm run restore -- <name>\n` : "\n  No backups yet. Make one with:  npm run backup\n");
    return;
  }
  const dir = join(BACKUPS, name);
  if (!existsSync(join(dir, "data.sql"))) fail(`Backup "${name}" not found.`);
  if (!(await databaseReachable())) fail("The local database isn't running. Start the site first.");

  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\n  This REPLACES all current data with the backup "${name}". Type YES to continue: `);
    rl.close();
    if (answer.trim() !== "YES") fail("Cancelled. Nothing was changed.");
  }

  console.log("  Resetting the local database (structure only)…");
  const reset = run(supabaseBin, ["db", "reset", "--local", "--no-seed"]);
  if (reset.code !== 0) fail(`Reset failed:\n${reset.stderr}`);

  console.log("  Loading the backed-up data…");
  // Rows created by the structure (default settings) are replaced by the backup's.
  const sql = `delete from public.site_settings;\n${readFileSync(join(dir, "data.sql"), "utf8")}`;
  const load = run("docker", ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-q", "-v", "ON_ERROR_STOP=1"], { input: sql });
  if (load.code !== 0) fail(`Loading the data failed:\n${load.stderr}`);

  let files = 0;
  const storageDir = join(dir, "storage");
  if (existsSync(storageDir)) {
    for (const file of walk(storageDir)) {
      const [bucket, ...rest] = relative(storageDir, file).split(sep);
      const res = await fetch(`${API}/storage/v1/object/${bucket}/${rest.join("/")}`, {
        method: "POST",
        headers: { ...auth, "x-upsert": "true", "Content-Type": guessType(file) },
        body: readFileSync(file),
      });
      if (res.ok) files += 1;
      else console.warn(`  ! Couldn't restore ${bucket}/${rest.join("/")} (${res.status})`);
    }
  }
  console.log(`  ✓ Restored the database and ${files} file${files === 1 ? "" : "s"} from ${name}.`);
  console.log("  Restart the site (Stop, then Start) so every page shows the restored data.\n");
}

function guessType(file) {
  const ext = file.split(".").pop().toLowerCase();
  return (
    { webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", webp: "image/webp", jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png" }[ext] ??
    "application/octet-stream"
  );
}

const [command, arg] = process.argv.slice(2);
if (command === "backup") await backup();
else if (command === "restore") await restore(arg);
else fail("Use: node scripts/backup.mjs backup | restore [name]");

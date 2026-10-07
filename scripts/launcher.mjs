#!/usr/bin/env node
/**
 * Beyond Listening — one-click launcher (macOS, Windows, Linux).
 *
 * Called by "Start Beyond Listening.command" / ".bat" and "Stop …".
 * Uses only Node built-ins so it can run before `npm ci`.
 *
 *   node scripts/launcher.mjs start   → Docker check, install, database, build, run, open browser
 *   node scripts/launcher.mjs stop    → stop the site and the local database (data is kept)
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RUNTIME = join(ROOT, ".runtime");
const STATE_FILE = join(RUNTIME, "state.json");
const PID_FILE = join(RUNTIME, "server.pid");
const LOG_FILE = join(RUNTIME, "launcher.log");
const ENV_FILE = join(ROOT, ".env.local");
const PORT = 3000;
const SITE_URL = `http://localhost:${PORT}`;

const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

mkdirSync(RUNTIME, { recursive: true });

// ─── output ──────────────────────────────────────────────────────────────

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function log(message = "") {
  console.log(message);
  appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message.replace(/\x1b\[\d+m/g, "")}\n`);
}
const step = (n, total, text) => log(`\n${c.bold(`[${n}/${total}]`)} ${text}`);
const ok = (text) => log(`      ${c.green("✓")} ${text}`);

class FriendlyError extends Error {}

// ─── process helpers ────────────────────────────────────────────────────

/**
 * Where Docker Desktop may be installed: system-wide or per-user (newer
 * installers on Windows default to the per-user folder).
 */
const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "";
const dockerInstalls = isWin
  ? [
      { app: join(process.env.ProgramFiles ?? "C:\\Program Files", "Docker", "Docker", "Docker Desktop.exe"),
        bin: join(process.env.ProgramFiles ?? "C:\\Program Files", "Docker", "Docker", "resources", "bin") },
      { app: join(process.env.LOCALAPPDATA ?? "", "Programs", "DockerDesktop", "Docker Desktop.exe"),
        bin: join(process.env.LOCALAPPDATA ?? "", "Programs", "DockerDesktop", "resources", "bin") },
    ]
  : isMac
    ? [
        { app: "/Applications/Docker.app", bin: "/Applications/Docker.app/Contents/Resources/bin" },
        { app: join(HOME, "Applications", "Docker.app"), bin: join(HOME, "Applications", "Docker.app", "Contents", "Resources", "bin") },
      ]
    : [];

/** Extra places where Docker / Homebrew put their command-line tools. */
const extraPaths = [
  ...(isWin ? [] : ["/usr/local/bin", "/opt/homebrew/bin", join(HOME, ".docker", "bin")]),
  ...dockerInstalls.map((d) => d.bin),
];
process.env.PATH = [process.env.PATH, ...extraPaths].join(isWin ? ";" : ":");

function bin(name) {
  return join(ROOT, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
}

function quote(arg) {
  return /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

/** Runs a command, streaming its output. Resolves with the exit code. */
function run(command, args, { env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(isWin ? [command, ...args].map(quote).join(" ") : command, isWin ? [] : args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: isWin,
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

/** Runs a command quietly and returns its output. */
function capture(command, args, timeout = 60_000) {
  const res = spawnSync(isWin ? [command, ...args].map(quote).join(" ") : command, isWin ? [] : args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: isWin,
    timeout,
  });
  return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function openInBrowser(url) {
  if (process.env.BL_NO_BROWSER) return log(c.dim(`      (would open ${url})`));
  if (isMac) spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  else if (isWin) spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  else spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

async function pressEnter(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question(question);
  rl.close();
}

// ─── state ──────────────────────────────────────────────────────────────

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeState(patch) {
  writeFileSync(STATE_FILE, JSON.stringify({ ...readState(), ...patch }, null, 2));
}

function fingerprint(paths) {
  const hash = createHash("sha1");
  const walk = (p) => {
    if (!existsSync(p)) return;
    const s = statSync(p);
    if (s.isDirectory()) {
      for (const entry of readdirSync(p).sort()) walk(join(p, entry));
    } else {
      hash.update(`${p}:${s.size}:${s.mtimeMs}\n`);
    }
  };
  for (const p of paths) walk(join(ROOT, p));
  return hash.digest("hex");
}

// ─── steps ──────────────────────────────────────────────────────────────

function dockerAppPath() {
  return dockerInstalls.find((d) => existsSync(d.app))?.app ?? null;
}

function dockerRunning() {
  return capture("docker", ["info"], 20_000).code === 0;
}

async function ensureDocker() {
  if (dockerRunning()) return ok("Docker is running");

  const app = dockerAppPath();
  const installed = (app && existsSync(app)) || capture("docker", ["--version"]).code === 0;

  if (!installed) {
    log("");
    log(c.yellow("  Docker Desktop is not installed yet. It is needed once, to run the local database."));
    log("  1. A download page will open in your browser.");
    log(`  2. Download Docker Desktop for ${isMac ? "Mac (choose Apple chip or Intel chip)" : "Windows"} and install it.`);
    log("  3. Open Docker Desktop once, accept its terms, and wait until it says 'Engine running'.");
    log("     (You can skip creating a Docker account.)");
    log("  4. Then double-click 'Start Beyond Listening' again.");
    openInBrowser("https://www.docker.com/products/docker-desktop/");
    throw new FriendlyError("Docker Desktop needs to be installed first.");
  }

  log("      Starting Docker Desktop (this can take a minute)…");
  if (isMac) spawn("open", app ? [app] : ["-a", "Docker"], { detached: true, stdio: "ignore" }).unref();
  else if (isWin && app) spawn(app, [], { detached: true, stdio: "ignore" }).unref();

  for (let i = 0; i < 90; i++) {
    await sleep(2000);
    if (dockerRunning()) return ok("Docker is running");
  }
  throw new FriendlyError(
    "Docker Desktop did not start. Open it manually, wait until it says 'Engine running', then try again.",
  );
}

async function ensureDependencies() {
  const lockHash = fingerprint(["package-lock.json"]);
  if (existsSync(join(ROOT, "node_modules")) && readState().lockHash === lockHash) {
    return ok("Software components already installed");
  }
  log("      Installing software components (first time: a few minutes)…");
  if ((await run("npm", ["ci", "--no-audit", "--no-fund"])) !== 0) {
    throw new FriendlyError("Installing components failed. Check your internet connection and try again.");
  }
  writeState({ lockHash });
  ok("Software components installed");
}

async function startDatabase() {
  if (!readState().databaseInitialized) {
    log("      First start: downloading the database (about 1–2 GB, once). This can take 5–15 minutes…");
  }
  const code = await run(bin("supabase"), ["start"]);
  if (code !== 0) {
    throw new FriendlyError(
      "The local database could not start. Make sure Docker Desktop is running, then try again.",
    );
  }
  writeState({ databaseInitialized: true });
  ok("Database is running");
}

function readEnvFile() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return out;
}

function writeEnv() {
  const res = capture(bin("supabase"), ["status", "-o", "json"]);
  let status;
  try {
    status = JSON.parse(res.stdout.slice(res.stdout.indexOf("{")));
  } catch {
    throw new FriendlyError("Could not read the database settings. Try stopping and starting again.");
  }
  const existing = readEnvFile();
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
    LOCAL_INBOX_URL: status.MAILPIT_URL ?? status.INBUCKET_URL ?? "http://127.0.0.1:54324",
    SITE_URL,
    EMAIL_PROVIDER: existing.EMAIL_PROVIDER ?? "local",
    MUSIC_PROVIDER: existing.MUSIC_PROVIDER ?? "live",
    // Generated once and kept: used to sign tokens and hash IP addresses.
    APP_SECRET: existing.APP_SECRET ?? randomBytes(32).toString("hex"),
  };
  const body =
    "# Written automatically by the launcher (scripts/launcher.mjs). Local use only.\n" +
    "# Never share or commit this file.\n" +
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") +
    "\n";
  writeFileSync(ENV_FILE, body);
  ok("Settings written");
  return env;
}

async function ensureBuild() {
  const sourceHash = fingerprint([
    "src",
    "public",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
  ]);
  if (existsSync(join(ROOT, ".next", "BUILD_ID")) && readState().sourceHash === sourceHash) {
    return ok("Site is up to date");
  }
  log("      Preparing the site (first time or after an update: 1–3 minutes)…");
  if ((await run(bin("next"), ["build"])) !== 0) {
    throw new FriendlyError("Preparing the site failed. The details are above and in .runtime/launcher.log.");
  }
  writeState({ sourceHash });
  ok("Site prepared");
}

async function siteResponds() {
  try {
    const res = await fetch(`${SITE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startSite(env) {
  if (await siteResponds()) {
    ok("Site was already running");
    return null;
  }
  const server = spawn(isWin ? `${quote(bin("next"))} start -p ${PORT}` : bin("next"), isWin ? [] : ["start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    shell: isWin,
    env: { ...process.env, ...env, NODE_ENV: "production" },
  });
  writeFileSync(PID_FILE, String(server.pid));
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    if (server.exitCode !== null) break;
    if (await siteResponds()) return server;
  }
  server.kill();
  throw new FriendlyError(
    `The site did not start. Is another program using port ${PORT}? Close it and try again.`,
  );
}

function killServer() {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, "utf8"));
  rmSync(PID_FILE, { force: true });
  if (!pid) return;
  try {
    if (isWin) spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    else process.kill(pid, "SIGTERM");
  } catch {
    /* already stopped */
  }
}

// ─── commands ───────────────────────────────────────────────────────────

async function start() {
  log(c.bold("\n  Beyond Listening — starting the local prototype"));
  log(c.dim("  Everything runs on this computer. Closing this window stops the site.\n"));

  const total = 5;
  step(1, total, "Checking Docker");
  await ensureDocker();
  step(2, total, "Checking software components");
  await ensureDependencies();
  step(3, total, "Starting the local database");
  await startDatabase();
  const env = writeEnv();
  step(4, total, "Checking the site");
  await ensureBuild();
  step(5, total, "Starting the site");
  const server = await startSite(env);

  log("");
  log(c.green(c.bold("  ✓ Beyond Listening is running")));
  log("");
  log(`    Site:          ${c.bold(SITE_URL)}`);
  log(`    Admin:         ${SITE_URL}/admin`);
  log(`    Local inbox:   ${env.LOCAL_INBOX_URL}   ${c.dim("(all emails the site 'sends' land here)")}`);
  log(`    Styleguide:    ${SITE_URL}/styleguide`);
  log("");
  log(c.dim("  Keep this window open while you use the site."));
  log(c.dim("  To stop: close this window, or use 'Stop Beyond Listening' to also stop the database."));
  openInBrowser(SITE_URL);

  if (!server) return;
  const shutdown = () => {
    killServer();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGHUP", shutdown);
  await new Promise((resolve) => server.on("exit", resolve));
  rmSync(PID_FILE, { force: true });
}

async function stop() {
  log(c.bold("\n  Beyond Listening — stopping"));
  killServer();
  ok("Site stopped");
  if (dockerRunning() && existsSync(bin("supabase"))) {
    await run(bin("supabase"), ["stop"]);
    ok("Database stopped (your data is kept)");
  } else {
    ok("Database was not running");
  }
  log(c.green("\n  All stopped. You can close this window."));
}

const command = process.argv[2] ?? "start";
try {
  if (command === "start") await start();
  else if (command === "stop") await stop();
  else throw new FriendlyError(`Unknown command: ${command}`);
} catch (error) {
  log("");
  if (error instanceof FriendlyError) {
    log(c.red(`  ✗ ${error.message}`));
  } else {
    log(c.red("  ✗ Something unexpected went wrong."));
    log(String(error?.stack ?? error));
  }
  log(c.dim(`  A log of this run is saved in ${LOG_FILE}`));
  if (process.stdin.isTTY) await pressEnter("\n  Press Enter to close…");
  process.exit(1);
}

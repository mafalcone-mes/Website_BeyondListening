import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Best-effort client IP (behind a proxy, the first x-forwarded-for entry). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Privacy-preserving visitor fingerprint: SHA-256 of today's random salt + IP.
 * Salts are deleted after 2 days, so old hashes can no longer be linked to an IP.
 * The raw IP is never stored.
 */
export async function visitorHash(): Promise<string> {
  const [ip, salt] = await Promise.all([clientIp(), todaysSalt()]);
  return createHash("sha256").update(salt).update(ip).digest("hex");
}

let saltCache: { day: string; salt: Buffer } | undefined;

async function todaysSalt(): Promise<Buffer> {
  const day = new Date().toISOString().slice(0, 10);
  if (saltCache?.day === day) return saltCache.salt;
  const { data, error } = await supabaseAdmin().rpc("current_hash_salt");
  if (error || typeof data !== "string") throw new Error(`salt unavailable: ${error?.message}`);
  const salt = Buffer.from(data.replace(/^\\x/, ""), "hex");
  saltCache = { day, salt };
  return salt;
}

/** Postgres bytea literal for a hex string. */
export const bytea = (hex: string) => `\\x${hex}`;

/**
 * Fixed-window rate limit. Returns true when allowed.
 * Fails open if the database is unreachable (the call would fail anyway).
 */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) return true;
  return data === true;
}

/** Random URL-safe token (sent by email) and its SHA-256 hash (stored). */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

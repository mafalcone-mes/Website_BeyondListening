import "server-only";
import { rateLimit, visitorHash } from "@/lib/security";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** Per-visitor rate limit for route handlers. Returns an error response when exceeded. */
export async function limitVisitor(bucket: string, windowSeconds: number, max: number) {
  const allowed = await rateLimit(`${bucket}:${await visitorHash()}`, windowSeconds, max);
  return allowed ? null : jsonError(429, "rate_limited", "Too many requests. Please wait a moment and try again.");
}

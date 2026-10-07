import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Supabase Storage URLs as the browser should see them: through this site's
 * /sb proxy (see next.config.ts), relative to whatever host the visitor used.
 */
export function browserUrl(url: string): string {
  const base = serverEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return url.startsWith(base) ? `/sb${url.slice(base.length)}` : url;
}

export function publicCoverUrl(path: string | null): string | null {
  return path ? `/sb/storage/v1/object/public/covers/${path}` : null;
}

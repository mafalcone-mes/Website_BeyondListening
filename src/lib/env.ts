import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Locally, `.env.local` is written by the launcher
 * (scripts/launcher.mjs) from `supabase status`, so nobody edits it by hand.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SITE_URL: z.url().default("http://localhost:3000"),
  LOCAL_INBOX_URL: z.url().optional(),
  EMAIL_PROVIDER: z.enum(["local", "smtp"]).default("local"),
  MUSIC_PROVIDER: z.enum(["live", "mock"]).default("live"),
  APP_SECRET: z.string().min(32),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(
        "Missing or invalid environment settings. Start the site with the " +
          "'Start Beyond Listening' launcher, which creates them automatically.\n" +
          z.prettifyError(parsed.error),
      );
    }
    cached = parsed.data;
  }
  return cached;
}

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

/**
 * Client acting as the logged-in admin (session in httpOnly cookies).
 * Row Level Security applies, as a second line of defence behind requireAdmin().
 */
export async function supabaseSession() {
  const env = serverEnv();
  const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* called from a Server Component: the proxy refreshes the session instead */
        }
      },
    },
  });
}

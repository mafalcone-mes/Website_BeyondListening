import { connection } from "next/server";
import { serverEnv } from "@/lib/env";

/** Used by the launcher to know when the site and the database are ready. */
export async function GET() {
  await connection();
  try {
    const env = serverEnv();
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      cache: "no-store",
    });
    return Response.json({ site: "ok", database: res.ok ? "ok" : "unreachable" });
  } catch (error) {
    return Response.json(
      { site: "ok", database: "unreachable", error: String(error) },
      { status: 503 },
    );
  }
}

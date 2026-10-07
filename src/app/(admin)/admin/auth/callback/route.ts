import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { supabaseSession } from "@/lib/supabase/server";

/** Magic-link landing: exchanges the one-time code for a session cookie. */
export async function GET(request: NextRequest) {
  await connection();
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await supabaseSession();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return Response.redirect(new URL("/admin", request.nextUrl), 303);
  }
  return Response.redirect(new URL("/admin/login?expired=1", request.nextUrl), 303);
}

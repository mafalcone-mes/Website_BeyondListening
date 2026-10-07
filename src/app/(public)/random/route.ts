import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { supabasePublic } from "@/lib/supabase/public";

/** Redirects to a random published story (?audio=1 → voice stories only). */
export async function GET(request: NextRequest) {
  await connection();
  const audioOnly = request.nextUrl.searchParams.get("audio") === "1";
  const { data } = await supabasePublic().rpc("random_story", { p_audio_only: audioOnly });
  const target = data ? `/stories/${data}` : "/archive";
  return Response.redirect(new URL(target, request.nextUrl), 307);
}

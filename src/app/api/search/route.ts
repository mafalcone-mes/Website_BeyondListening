import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { limitVisitor } from "@/lib/api";
import { supabasePublic } from "@/lib/supabase/public";

/** Type-ahead search across the archive: songs with stories, artists, story text. */
export async function GET(request: NextRequest) {
  await connection();
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return Response.json({ songs: [], artists: [], stories: [] });
  const limited = await limitVisitor("search", 60, 60);
  if (limited) return limited;
  const { data, error } = await supabasePublic().rpc("search_archive", { p_q: q, p_limit: 6 });
  if (error) return Response.json({ songs: [], artists: [], stories: [] }, { status: 503 });
  return Response.json(data, { headers: { "Cache-Control": "private, max-age=30" } });
}

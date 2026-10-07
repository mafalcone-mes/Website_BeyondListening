import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { limitVisitor } from "@/lib/api";
import { searchCatalog } from "@/lib/music";

/** External catalog search (Deezer, fallback iTunes). Results are cached for 24 h. */
export async function GET(request: NextRequest) {
  await connection();
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return Response.json({ results: [] });
  const limited = await limitVisitor("music-search", 60, 20);
  if (limited) return limited;
  const results = await searchCatalog(q);
  return Response.json({ results }, { headers: { "Cache-Control": "private, max-age=60" } });
}

import { connection } from "next/server";
import { jsonError, UUID } from "@/lib/api";
import { supabasePublic } from "@/lib/supabase/public";

/** Public reaction counts (fetched by the browser so story pages can stay cached). */
export async function GET(_request: Request, ctx: RouteContext<"/api/stories/[id]/reactions">) {
  await connection();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError(400, "bad_id", "Unknown story.");
  const { data, error } = await supabasePublic().rpc("story_reactions", { p_story: id });
  if (error) return jsonError(503, "unavailable", "Counts unavailable.");
  return Response.json({ counts: data ?? {} }, { headers: { "Cache-Control": "public, max-age=15" } });
}

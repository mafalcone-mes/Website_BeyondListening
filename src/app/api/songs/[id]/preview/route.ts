import { connection } from "next/server";
import { jsonError, limitVisitor, UUID } from "@/lib/api";
import { resolvePreview } from "@/lib/music";

/**
 * Returns a fresh 30-second preview URL for a song. The browser plays it
 * directly from Deezer/Apple: we never download, proxy or store the audio.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/songs/[id]/preview">) {
  await connection();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError(400, "bad_id", "Unknown song.");
  const limited = await limitVisitor("preview", 60, 60);
  if (limited) return limited;
  const preview = await resolvePreview(id);
  return Response.json(preview, { headers: { "Cache-Control": "private, max-age=300" } });
}

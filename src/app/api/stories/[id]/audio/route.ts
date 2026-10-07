import { connection } from "next/server";
import { jsonError, limitVisitor, UUID } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Short-lived signed URL for a published voice story (private storage). */
export async function GET(_request: Request, ctx: RouteContext<"/api/stories/[id]/audio">) {
  await connection();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError(400, "bad_id", "Unknown story.");
  const limited = await limitVisitor("story-audio", 60, 60);
  if (limited) return limited;

  const db = supabaseAdmin();
  const { data: story } = await db
    .from("stories")
    .select("audio_path, audio_duration_s, audio_peaks, status")
    .eq("id", id)
    .maybeSingle();
  if (!story || story.status !== "published" || !story.audio_path) {
    return jsonError(404, "not_available", "This recording isn't available.");
  }
  const { data, error } = await db.storage.from("audio-published").createSignedUrl(story.audio_path, 3600);
  if (error || !data) return jsonError(503, "storage", "The recording can't be played right now.");
  return Response.json(
    { url: data.signedUrl, durationS: story.audio_duration_s, peaks: story.audio_peaks },
    { headers: { "Cache-Control": "private, max-age=600" } },
  );
}

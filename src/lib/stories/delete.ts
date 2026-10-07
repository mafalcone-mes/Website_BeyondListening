import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Permanently deletes a story: its recording files (in every bucket), the story
 * row and everything attached to it (contact, tags, reactions). Playlist tracks
 * keep the song and show "removed by its author". Leaves a log line without
 * personal data. Returns the song title (for confirmation emails).
 */
export async function deleteStoryPermanently(
  storyId: string,
  { actor, reason }: { actor: string | null; reason: "author_request" | "admin_delete" | "expired" | "rejected_cleanup" },
): Promise<{ ok: boolean; songTitle: string | null }> {
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("id, songs(title)").eq("id", storyId).maybeSingle();
  if (!story) return { ok: false, songTitle: null };

  for (const bucket of ["audio-incoming", "audio-published"]) {
    const { data: files } = await db.storage.from(bucket).list(storyId, { limit: 100 });
    if (files?.length) await db.storage.from(bucket).remove(files.map((f) => `${storyId}/${f.name}`));
  }
  const { error } = await db.from("stories").delete().eq("id", storyId);
  if (error) return { ok: false, songTitle: null };
  await db.from("moderation_log").insert({ actor, action: "delete", entity_type: "story", entity_id: storyId, details: { reason } });
  return { ok: true, songTitle: (story.songs as unknown as { title: string } | null)?.title ?? null };
}

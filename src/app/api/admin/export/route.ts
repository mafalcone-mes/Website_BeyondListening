import { connection } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseSession } from "@/lib/supabase/server";

/**
 * Everything in the archive as JSON (admin only), plus short-lived links to every
 * recording. The admin's browser downloads the recordings and zips it all.
 * Contains personal data (emails): keep the export file safe.
 */
export async function GET() {
  await connection();
  const session = await supabaseSession();
  const { data: user } = await session.auth.getUser();
  if (!user.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await session.from("admin_profiles").select("user_id").eq("user_id", user.user.id).maybeSingle();
  if (!profile) return Response.json({ error: "forbidden" }, { status: 403 });

  const db = supabaseAdmin();
  const all = async (table: string) => (await db.from(table).select("*").limit(100000)).data ?? [];
  const [songs, stories, contacts, tags, storyTags, playlists, items, reactionTypes, reactionCounts, settings] = await Promise.all([
    all("songs"),
    all("stories"),
    db.from("story_contacts").select("story_id, email, created_at").limit(100000).then((r) => r.data ?? []),
    all("tags"),
    all("story_tags"),
    all("playlists"),
    all("playlist_items"),
    all("reaction_types"),
    all("story_reaction_counts"),
    all("site_settings"),
  ]);
  const audio: { path: string; url: string }[] = [];
  for (const s of stories as { audio_path: string | null; status: string }[]) {
    if (!s.audio_path) continue;
    const bucket = s.status === "published" || s.status === "unpublished" ? "audio-published" : "audio-incoming";
    const { data } = await db.storage.from(bucket).createSignedUrl(s.audio_path, 3600);
    if (data?.signedUrl) audio.push({ path: `recordings/${s.audio_path}`, url: data.signedUrl });
  }
  await db.from("moderation_log").insert({ actor: user.user.id, action: "export", entity_type: "archive", details: { stories: stories.length } });
  return Response.json(
    {
      exportedAt: new Date().toISOString(),
      note: "Beyond Listening full export. Contains personal data (contributor emails): store it safely.",
      data: { songs, stories, contacts, tags, storyTags, playlists, playlistItems: items, reactionTypes, reactionCounts, settings },
      audio,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

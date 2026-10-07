"use server";
import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { LIMITS } from "@/config/limits";
import { CONSENT_VERSION } from "@/content/legal";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { getSongForSubmission, type PickedSong } from "@/features/submission/actions";
import { extensionForMime, verifyAudioObject } from "@/features/submission/verify-audio";
import { enrichSong, upsertSong } from "@/lib/music";
import { slugify } from "@/lib/music/normalize";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./auth";
import { approveStory, type AdminResult } from "./story-actions";

const uuid = z.uuid();
const changed = (message: string, extra: Record<string, unknown> = {}) => {
  updateTag(CONTENT_TAG);
  return { ok: true as const, message, ...extra };
};

const playlistInput = z.object({
  title: z.string().trim().min(1).max(160),
  sessionDate: z.union([z.iso.date(), z.literal("")]),
  location: z.string().trim().max(160),
  description: z.string().trim().max(2000),
});

export async function createPlaylist(raw: z.input<typeof playlistInput>): Promise<AdminResult & { id?: string }> {
  const { user } = await requireAdmin();
  const p = playlistInput.safeParse(raw);
  if (!p.success) return { ok: false, message: "A session needs a title." };
  const db = supabaseAdmin();
  const base = slugify(`${p.data.title} ${p.data.sessionDate}`, 60) || "session";
  const { data, error } = await db
    .from("playlists")
    .insert({
      slug: `${base}-${randomBytes(2).toString("hex")}`,
      title: p.data.title,
      session_date: p.data.sessionDate || null,
      location: p.data.location || null,
      description: p.data.description || null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: "Couldn't create the session." };
  await db.from("moderation_log").insert({ actor: user.id, action: "create_playlist", entity_type: "playlist", entity_id: data.id });
  return { ok: true, message: "Session created.", id: data.id };
}

export async function updatePlaylist(id: string, raw: z.input<typeof playlistInput>): Promise<AdminResult> {
  await requireAdmin();
  const p = playlistInput.safeParse(raw);
  if (!uuid.safeParse(id).success || !p.success) return { ok: false, message: "A session needs a title." };
  await supabaseAdmin()
    .from("playlists")
    .update({
      title: p.data.title,
      session_date: p.data.sessionDate || null,
      location: p.data.location || null,
      description: p.data.description || null,
    })
    .eq("id", id);
  return changed("Saved.");
}

/** Cover image: resized in the browser to WebP (well under 1 MB) before it gets here. */
export async function uploadCover(playlistId: string, formData: FormData): Promise<AdminResult> {
  await requireAdmin();
  const file = formData.get("cover");
  if (!uuid.safeParse(playlistId).success || !(file instanceof File)) return { ok: false, message: "No image received." };
  if (!["image/webp", "image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Please use a JPEG, PNG or WebP image under 5 MB." };
  }
  const db = supabaseAdmin();
  const path = `playlists/${playlistId}/${randomBytes(6).toString("hex")}.${file.type.split("/")[1]}`;
  const { error } = await db.storage.from("covers").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, message: "Upload failed. Please try again." };
  const { data: old } = await db.from("playlists").select("cover_path").eq("id", playlistId).single();
  await db.from("playlists").update({ cover_path: path }).eq("id", playlistId);
  if (old?.cover_path) await db.storage.from("covers").remove([old.cover_path]);
  return changed("Cover updated.");
}

export async function adminPickSong(provider: "deezer" | "itunes" | "mock", providerId: string): Promise<PickedSong | null> {
  await requireAdmin();
  if (!z.string().regex(/^[a-z0-9-]{1,40}$/i).safeParse(providerId).success) return null;
  const saved = await upsertSong(provider, providerId);
  if (!saved) return null;
  if (saved.created) after(() => enrichSong(saved.id));
  return getSongForSubmission(saved.id);
}

/** Stories that could be linked to a track: same song first, then a text search. */
export async function findStories(songId: string, q: string) {
  await requireAdmin();
  const db = supabaseAdmin();
  const query = db
    .from("stories")
    .select("id, title, author_display_name, status, format, body_text, transcript, songs(title, artist)")
    .in("status", ["published", "pending_review"])
    .limit(20);
  const { data } = q.trim().length >= 2
    ? await query.textSearch("search_tsv", q.trim().split(/\s+/).map((w) => `${w.replace(/[^\p{L}\p{N}]/gu, "")}:*`).filter((w) => w.length > 2).join(" & "), { config: "english" })
    : await query.eq("song_id", songId).order("created_at", { ascending: false });
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    author: s.author_display_name,
    status: s.status,
    excerpt: (s.body_text ?? s.transcript ?? "").slice(0, 140),
    song: s.songs as unknown as { title: string; artist: string },
  }));
}

export async function addTrack(raw: { playlistId: string; songId: string; storyId?: string | null }): Promise<AdminResult> {
  await requireAdmin();
  const p = z.object({ playlistId: uuid, songId: uuid, storyId: uuid.nullable().optional() }).safeParse(raw);
  if (!p.success) return { ok: false, message: "Something is wrong with this track." };
  const db = supabaseAdmin();
  const { data: last } = await db
    .from("playlist_items")
    .select("position")
    .eq("playlist_id", p.data.playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  await db.from("playlist_items").insert({
    playlist_id: p.data.playlistId,
    song_id: p.data.songId,
    story_id: p.data.storyId ?? null,
    position: (last?.position ?? -1) + 1,
  });
  return changed("Track added.");
}

export async function setTrackStory(itemId: string, storyId: string | null): Promise<AdminResult> {
  await requireAdmin();
  if (!uuid.safeParse(itemId).success || (storyId && !uuid.safeParse(storyId).success)) return { ok: false, message: "Invalid." };
  await supabaseAdmin().from("playlist_items").update({ story_id: storyId }).eq("id", itemId);
  return changed("Track updated.");
}

/** Saves the new order of a playlist's tracks (item ids, top to bottom). */
export async function reorderTracks(playlistId: string, itemIds: string[]): Promise<AdminResult> {
  await requireAdmin();
  if (!uuid.safeParse(playlistId).success || !z.array(uuid).max(200).safeParse(itemIds).success) {
    return { ok: false, message: "Invalid order." };
  }
  const db = supabaseAdmin();
  // Two passes avoid clashing with the unique (playlist, position) constraint.
  await Promise.all(itemIds.map((id, i) => db.from("playlist_items").update({ position: 1000 + i }).eq("id", id).eq("playlist_id", playlistId)));
  await Promise.all(itemIds.map((id, i) => db.from("playlist_items").update({ position: i }).eq("id", id).eq("playlist_id", playlistId)));
  return changed("Order saved.");
}

export async function removeTrack(itemId: string): Promise<AdminResult> {
  await requireAdmin();
  if (!uuid.safeParse(itemId).success) return { ok: false, message: "Invalid." };
  await supabaseAdmin().from("playlist_items").delete().eq("id", itemId);
  return changed("Track removed.");
}

const sessionStoryInput = z.object({
  playlistId: uuid,
  songId: uuid,
  pseudonym: z.string().trim().min(1).max(LIMITS.pseudonym),
  email: z.union([z.email(), z.literal("")]),
  title: z.string().trim().max(LIMITS.title),
  bodyText: z.string().trim().max(LIMITS.storyText),
  transcript: z.string().trim().max(LIMITS.transcript),
  audio: z
    .object({ mime: z.string().max(60), durationS: z.number().int().min(1).max(LIMITS.audioSeconds + 10), peaks: z.array(z.number()).max(400) })
    .nullable(),
  consents: z.object({
    publication: z.literal(true),
    license: z.literal(true),
    age: z.literal(true),
    privacy: z.literal(true),
    voice: z.boolean(),
    promotion: z.boolean(),
  }),
});

/**
 * A story told at a live session, entered by the admin on the participant's behalf.
 * Consent is recorded as "admin_recorded" (the participant ticked the boxes on the admin's phone).
 */
export async function createSessionStory(
  raw: z.input<typeof sessionStoryInput>,
): Promise<AdminResult & { storyId?: string; upload?: { path: string; signedUrl: string } }> {
  const { user } = await requireAdmin();
  const p = sessionStoryInput.safeParse(raw);
  if (!p.success) return { ok: false, message: "Please add a name, the story (written or recorded) and the participant's consent." };
  const s = p.data;
  const format = s.audio ? (s.bodyText ? "text_audio" : "audio") : "text";
  if (format === "text" && !s.bodyText) return { ok: false, message: "Please write the story or record it." };
  if (format !== "text" && !s.consents.voice) return { ok: false, message: "The participant must agree to publishing their voice." };

  const db = supabaseAdmin();
  const { data: story, error } = await db
    .from("stories")
    .insert({
      song_id: s.songId,
      title: s.title || null,
      body_text: s.bodyText || null,
      format,
      audio_duration_s: s.audio?.durationS ?? null,
      audio_peaks: s.audio?.peaks ?? null,
      transcript: format !== "text" ? s.transcript || null : null,
      transcript_source: format !== "text" && s.transcript ? "admin" : null,
      author_display_name: s.pseudonym,
      status: "pending_review",
      source: "live_session",
      playlist_id: s.playlistId,
      consent_publication: true,
      consent_license: true,
      consent_privacy: true,
      consent_age: true,
      consent_voice: format !== "text",
      consent_promotion: s.consents.promotion,
      consent_version: CONSENT_VERSION,
      consent_method: "admin_recorded",
      consent_recorded_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !story) return { ok: false, message: "Couldn't save the story." };
  await db.from("story_contacts").insert({ story_id: story.id, email: s.email || null });
  await addTrack({ playlistId: s.playlistId, songId: s.songId, storyId: story.id });
  await db.from("moderation_log").insert({ actor: user.id, action: "session_story", entity_type: "story", entity_id: story.id });

  if (s.audio) {
    const path = `${story.id}/${randomBytes(8).toString("hex")}.${extensionForMime(s.audio.mime)}`;
    const { data: signed } = await db.storage.from("audio-incoming").createSignedUploadUrl(path);
    if (!signed) return { ok: false, message: "Couldn't prepare the upload." };
    return { ok: true, storyId: story.id, upload: { path, signedUrl: signed.signedUrl } };
  }
  return changed("Story added to the session.", { storyId: story.id });
}

export async function finalizeSessionAudio(storyId: string, path: string): Promise<AdminResult> {
  await requireAdmin();
  if (!uuid.safeParse(storyId).success || !path.startsWith(`${storyId}/`)) return { ok: false, message: "Invalid." };
  const check = await verifyAudioObject("audio-incoming", path);
  if (!check.ok) return { ok: false, message: check.message };
  await supabaseAdmin()
    .from("stories")
    .update({ audio_path: path, ...(check.durationS ? { audio_duration_s: check.durationS } : {}) })
    .eq("id", storyId);
  return changed("Recording saved.");
}

/** Publishes the playlist and the new session stories in it (each needs a transcript if recorded). */
export async function publishPlaylist(playlistId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const db = supabaseAdmin();
  const { data: items } = await db
    .from("playlist_items")
    .select("story_id, songs(title), stories(id, status, format, transcript, audio_path)")
    .eq("playlist_id", playlistId);
  if (!items?.length) return { ok: false, message: "Add at least one track first." };
  const problems: string[] = [];
  for (const item of items) {
    const song = (item.songs as unknown as { title: string }).title;
    const story = item.stories as unknown as { id: string; status: string; format: string; transcript: string | null; audio_path: string | null } | null;
    if (!story) problems.push(`“${song}” has no story yet`);
    else if (story.format !== "text" && !story.audio_path) problems.push(`the recording for “${song}” hasn't finished uploading`);
    else if (story.format !== "text" && !story.transcript && story.status !== "published") problems.push(`“${song}” needs a transcript`);
  }
  if (problems.length) return { ok: false, message: `Not yet: ${problems.join("; ")}.` };

  for (const item of items) {
    const story = item.stories as unknown as { id: string; status: string };
    if (story.status !== "published") {
      const r = await approveStory({ storyId: story.id });
      if (!r.ok) return r;
    }
  }
  await db.from("playlists").update({ published: true, published_at: new Date().toISOString() }).eq("id", playlistId);
  await db.from("moderation_log").insert({ actor: user.id, action: "publish_playlist", entity_type: "playlist", entity_id: playlistId });
  return changed("Published! The session and its stories are now on the site.");
}

export async function unpublishPlaylist(playlistId: string): Promise<AdminResult> {
  await requireAdmin();
  await supabaseAdmin().from("playlists").update({ published: false }).eq("id", playlistId);
  return changed("The session is hidden. Its stories stay in the archive.");
}

export async function deletePlaylist(playlistId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const db = supabaseAdmin();
  const { data } = await db.from("playlists").select("cover_path, published").eq("id", playlistId).single();
  if (data?.published) return { ok: false, message: "Hide the session before deleting it." };
  if (data?.cover_path) await db.storage.from("covers").remove([data.cover_path]);
  await db.from("playlists").delete().eq("id", playlistId);
  await db.from("moderation_log").insert({ actor: user.id, action: "delete_playlist", entity_type: "playlist", entity_id: playlistId });
  return changed("Session deleted. Its stories stay in the archive.");
}

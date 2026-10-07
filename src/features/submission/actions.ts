"use server";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { LIMITS } from "@/config/limits";
import { CONSENT_VERSION } from "@/content/legal";
import { verifyAltcha } from "@/lib/captcha";
import { sendEmail, siteUrl } from "@/lib/email";
import { enrichSong, upsertSong } from "@/lib/music";
import { bytea, hashToken, newToken, rateLimit, visitorHash } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extensionForMime, verifyAudioObject } from "./verify-audio";
import { submissionSchema, type SubmissionInput } from "./schema";

export interface PickedSong {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  releaseYear: number | null;
}

const providerInput = z.object({
  provider: z.enum(["deezer", "itunes", "mock"]),
  providerId: z.string().regex(/^[a-z0-9-]{1,40}$/i),
});

/** Turns a catalog search result into our (deduplicated) song record. */
export async function pickSong(raw: z.input<typeof providerInput>): Promise<PickedSong | null> {
  const parsed = providerInput.safeParse(raw);
  if (!parsed.success) return null;
  if (!(await rateLimit(`pick-song:${await visitorHash()}`, 3600, 40))) return null;
  const saved = await upsertSong(parsed.data.provider, parsed.data.providerId);
  if (!saved) return null;
  if (saved.created) after(() => enrichSong(saved.id));
  return getSongForSubmission(saved.id);
}

export async function getSongForSubmission(songId: string): Promise<PickedSong | null> {
  if (!z.uuid().safeParse(songId).success) return null;
  const { data } = await supabaseAdmin()
    .from("songs")
    .select("id, slug, title, artist, album, artwork_url, release_year")
    .eq("id", songId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    artist: data.artist,
    album: data.album,
    artworkUrl: data.artwork_url,
    releaseYear: data.release_year,
  };
}

export type SubmitResult =
  | { ok: true; storyId: string; upload: { path: string; signedUrl: string; token: string } | null }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Creates the story (pending verification). Voice stories then upload their audio. */
export async function submitStory(raw: SubmissionInput): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;
  if (input.website) return { ok: false, message: "Something went wrong." };
  if (!(await verifyAltcha(input.altcha))) {
    return { ok: false, message: "The spam check didn't complete. Please wait a moment and try again." };
  }
  const visitor = await visitorHash();
  const email = input.email.toLowerCase();
  const allowed =
    (await rateLimit(`submit:${visitor}`, 24 * 3600, LIMITS.submissionsPerDayPerVisitor)) &&
    (await rateLimit(`submit-email:${hashToken(email)}`, 24 * 3600, LIMITS.submissionsPerDayPerEmail));
  if (!allowed) return { ok: false, message: "You've shared several stories today. Please try again tomorrow." };

  const db = supabaseAdmin();
  const { data: song } = await db.from("songs").select("id").eq("id", input.songId).maybeSingle();
  if (!song) return { ok: false, message: "We couldn't find that song. Please pick it again." };

  const { data: story, error } = await db
    .from("stories")
    .insert({
      song_id: input.songId,
      title: input.title,
      body_text: input.format === "audio" ? null : input.bodyText,
      format: input.format,
      audio_duration_s: input.audio ? Math.min(input.audio.durationS, LIMITS.audioSeconds) : null,
      audio_peaks: input.audio?.peaks ?? null,
      transcript: input.format === "text" ? null : input.transcript,
      transcript_reviewed: input.format !== "text" && Boolean(input.transcript) && input.transcriptReviewed,
      transcript_source: input.format !== "text" && input.transcript ? "contributor" : null,
      author_display_name: input.pseudonym,
      place_time_note: input.placeNote,
      status: "pending_verification",
      source: "public",
      consent_publication: true,
      consent_license: true,
      consent_privacy: true,
      consent_age: true,
      consent_voice: input.format !== "text" && input.consents.voice,
      consent_promotion: input.consents.promotion,
      consent_version: CONSENT_VERSION,
      consent_method: "web_form",
    })
    .select("id")
    .single();
  if (error || !story) return { ok: false, message: "We couldn't save your story. Please try again." };

  const verification = newToken();
  const upload = input.audio ? newToken() : null;
  await db.from("story_contacts").insert({
    story_id: story.id,
    email,
    verification_token_hash: bytea(verification.hash),
    verification_expires_at: new Date(Date.now() + LIMITS.verificationHours * 3600_000).toISOString(),
    upload_token_hash: upload ? bytea(upload.hash) : null,
    submitter_ip_hash: bytea(visitor),
  });
  if (input.tagIds.length) {
    await db.from("story_tags").insert(input.tagIds.map((tag_id) => ({ story_id: story.id, tag_id })));
  }

  if (input.audio && upload) {
    const path = `${story.id}/${randomBytes(8).toString("hex")}.${extensionForMime(input.audio.mime)}`;
    const { data: signed, error: signError } = await db.storage.from("audio-incoming").createSignedUploadUrl(path);
    if (signError || !signed) {
      await db.from("stories").delete().eq("id", story.id);
      return { ok: false, message: "We couldn't prepare the upload. Please try again." };
    }
    // The verification email is sent once the recording has arrived (finalizeAudio).
    await pendingVerification.set(story.id, verification.token);
    return { ok: true, storyId: story.id, upload: { path, signedUrl: signed.signedUrl, token: upload.token } };
  }

  await sendVerification(story.id, email, verification.token);
  return { ok: true, storyId: story.id, upload: null };
}

/*
 * For voice stories the raw verification token must survive until the upload
 * finishes. It's kept briefly in the music_cache table (server-only), never in the browser.
 */
const pendingVerification = {
  async set(storyId: string, token: string) {
    await supabaseAdmin()
      .from("music_cache")
      .upsert({ key: `pending-verify:${storyId}`, payload: { token }, expires_at: new Date(Date.now() + 3600_000).toISOString() });
  },
  async take(storyId: string): Promise<string | null> {
    const db = supabaseAdmin();
    const { data } = await db.from("music_cache").select("payload").eq("key", `pending-verify:${storyId}`).maybeSingle();
    await db.from("music_cache").delete().eq("key", `pending-verify:${storyId}`);
    return (data?.payload as { token?: string } | null)?.token ?? null;
  },
};

async function sendVerification(storyId: string, email: string, token: string) {
  const db = supabaseAdmin();
  const { data } = await db.from("stories").select("author_display_name, songs(title)").eq("id", storyId).single();
  await sendEmail(email, {
    template: "verify-story",
    data: {
      name: data?.author_display_name ?? "there",
      songTitle: (data?.songs as unknown as { title: string } | null)?.title ?? "your song",
      link: siteUrl(`/verify/${token}`),
    },
  });
}

const finalizeInput = z.object({ storyId: z.uuid(), uploadToken: z.string().min(20).max(100), path: z.string().max(200) });

/** Called after the browser uploaded the recording: checks the file, then sends the verification email. */
export async function finalizeAudio(raw: z.input<typeof finalizeInput>): Promise<{ ok: boolean; message?: string }> {
  const parsed = finalizeInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Something went wrong." };
  const { storyId, uploadToken, path } = parsed.data;
  if (!path.startsWith(`${storyId}/`)) return { ok: false, message: "Something went wrong." };

  const db = supabaseAdmin();
  const { data: contact } = await db
    .from("story_contacts")
    .select("email, upload_token_hash")
    .eq("story_id", storyId)
    .maybeSingle();
  if (!contact?.upload_token_hash || contact.upload_token_hash !== bytea(hashToken(uploadToken))) {
    return { ok: false, message: "This upload link has expired. Please submit again." };
  }

  const check = await verifyAudioObject("audio-incoming", path);
  if (!check.ok) {
    await db.storage.from("audio-incoming").remove([path]);
    return { ok: false, message: check.message };
  }

  await db
    .from("stories")
    .update({ audio_path: path, audio_duration_s: check.durationS ?? undefined })
    .eq("id", storyId);
  await db.from("story_contacts").update({ upload_token_hash: null }).eq("story_id", storyId);

  const token = await pendingVerification.take(storyId);
  if (token && contact.email) await sendVerification(storyId, contact.email, token);
  return { ok: true };
}

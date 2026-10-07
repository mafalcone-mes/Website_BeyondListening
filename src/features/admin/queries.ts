import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ReviewStory } from "./review-card";

/* Admin reads. Pages call requireAdmin() first; these use the privileged client. */

const REVIEW_COLUMNS =
  "id, title, body_text, transcript, transcript_reviewed, format, audio_duration_s, audio_peaks, author_display_name, place_time_note, source, created_at, consent_promotion, pending_edit, status, story_tags(tag_id), songs(id, slug, title, artist, artwork_url, release_year)";

type Row = {
  id: string;
  title: string | null;
  body_text: string | null;
  transcript: string | null;
  transcript_reviewed: boolean;
  format: ReviewStory["format"];
  audio_duration_s: number | null;
  audio_peaks: number[] | null;
  author_display_name: string;
  place_time_note: string | null;
  source: ReviewStory["source"];
  created_at: string;
  consent_promotion: boolean;
  pending_edit: Record<string, string | null> | null;
  status: string;
  story_tags: { tag_id: string }[];
  songs: { id: string; slug: string; title: string; artist: string; artwork_url: string | null; release_year: number | null };
};

export function toReviewStory(r: Row): ReviewStory {
  return {
    id: r.id,
    title: r.title,
    bodyText: r.body_text,
    transcript: r.transcript,
    transcriptReviewed: r.transcript_reviewed,
    format: r.format,
    durationS: r.audio_duration_s,
    peaks: r.audio_peaks,
    author: r.author_display_name,
    placeNote: r.place_time_note,
    source: r.source,
    createdAt: r.created_at,
    consentPromotion: r.consent_promotion,
    tagIds: r.story_tags.map((t) => t.tag_id),
    song: {
      id: r.songs.id,
      slug: r.songs.slug,
      title: r.songs.title,
      artist: r.songs.artist,
      artworkUrl: r.songs.artwork_url,
      releaseYear: r.songs.release_year,
    },
  };
}

export async function getReviewQueue() {
  const { data } = await supabaseAdmin()
    .from("stories")
    .select(REVIEW_COLUMNS)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  return ((data ?? []) as unknown as Row[]).map(toReviewStory);
}

export async function getPendingEdits() {
  const { data } = await supabaseAdmin()
    .from("stories")
    .select(REVIEW_COLUMNS)
    .not("pending_edit", "is", null)
    .order("updated_at", { ascending: true });
  return ((data ?? []) as unknown as Row[]).map((r) => ({ story: toReviewStory(r), edit: r.pending_edit! }));
}

export async function getStoryForEditor(storyId: string) {
  const { data } = await supabaseAdmin()
    .from("stories")
    .select(`${REVIEW_COLUMNS}, public_id, featured, published_at, playlist_id, rejection_reason, consent_method, consent_version, consented_at, consent_voice`)
    .eq("id", storyId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Row & {
    public_id: string;
    featured: boolean;
    published_at: string | null;
    rejection_reason: string | null;
    consent_method: string;
    consent_version: string;
    consented_at: string;
    consent_voice: boolean;
  };
  const [{ data: contact }, { data: history }] = await Promise.all([
    supabaseAdmin().from("story_contacts").select("email").eq("story_id", storyId).maybeSingle(),
    supabaseAdmin().from("moderation_log").select("action, created_at, details").eq("entity_id", storyId).order("created_at", { ascending: false }).limit(20),
  ]);
  return {
    story: toReviewStory(row),
    publicId: row.public_id,
    status: row.status,
    featured: row.featured,
    publishedAt: row.published_at,
    rejectionReason: row.rejection_reason,
    pendingEdit: row.pending_edit,
    consent: { method: row.consent_method, version: row.consent_version, at: row.consented_at, voice: row.consent_voice },
    hasEmail: Boolean(contact?.email),
    history: history ?? [],
  };
}

export async function getAllTags() {
  const { data } = await supabaseAdmin().from("tags").select("id, slug, label, description, sort_order, active").order("sort_order");
  return data ?? [];
}

"use server";
import { updateTag } from "next/cache";
import { z } from "zod";
import { LIMITS } from "@/config/limits";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { sendEmail, siteUrl } from "@/lib/email";
import { bytea, newToken } from "@/lib/security";
import { deleteStoryPermanently } from "@/lib/stories/delete";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./auth";

export type AdminResult = { ok: true; message?: string } | { ok: false; message: string };

const id = z.uuid();

async function log(actor: string, action: string, entityId: string, details: Record<string, unknown> = {}) {
  await supabaseAdmin().from("moderation_log").insert({ actor, action, entity_type: "story", entity_id: entityId, details });
}

async function setTags(storyId: string, tagIds: string[]) {
  const db = supabaseAdmin();
  await db.from("story_tags").delete().eq("story_id", storyId);
  if (tagIds.length) await db.from("story_tags").insert(tagIds.map((tag_id) => ({ story_id: storyId, tag_id })));
}

/** Moves a recording from the private "incoming" bucket to the private "published" bucket. */
async function publishAudio(path: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data: existing } = await db.storage.from("audio-published").list(path.split("/")[0]);
  if (existing?.some((f) => path.endsWith(f.name))) return true;
  const { error } = await db.storage.from("audio-incoming").move(path, path, { destinationBucket: "audio-published" });
  return !error;
}

const reviewInput = z.object({
  storyId: id,
  title: z.string().trim().max(LIMITS.title).optional(),
  transcript: z.string().trim().max(LIMITS.transcript).optional(),
  tagIds: z.array(z.uuid()).max(6).optional(),
});

/** Publishes a story (from the review queue, or again after it was hidden). */
export async function approveStory(raw: z.input<typeof reviewInput>): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const parsed = reviewInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Something is wrong with this form." };
  const { storyId, title, transcript, tagIds } = parsed.data;
  const db = supabaseAdmin();
  const { data: story } = await db
    .from("stories")
    .select("id, public_id, status, format, audio_path, transcript, published_at, author_display_name, songs(title)")
    .eq("id", storyId)
    .single();
  if (!story) return { ok: false, message: "Story not found." };

  const finalTranscript = transcript !== undefined ? transcript : story.transcript;
  if (story.format !== "text" && !finalTranscript) {
    return { ok: false, message: "Voice stories need a transcript before publishing. Add one (or generate it) first." };
  }
  if (story.audio_path && !(await publishAudio(story.audio_path))) {
    return { ok: false, message: "The recording couldn't be moved. Please try again." };
  }

  const firstPublication = !story.published_at;
  await db
    .from("stories")
    .update({
      status: "published",
      published_at: story.published_at ?? new Date().toISOString(),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(transcript !== undefined && story.format !== "text"
        ? { transcript: transcript || null, transcript_source: transcript !== story.transcript ? "admin" : undefined }
        : {}),
    })
    .eq("id", storyId);
  if (tagIds) await setTags(storyId, tagIds);
  await log(user.id, firstPublication ? "approve" : "republish", storyId);

  if (firstPublication) {
    const { data: contact } = await db.from("story_contacts").select("email").eq("story_id", storyId).maybeSingle();
    if (contact?.email) {
      const manage = newToken();
      await db.from("story_contacts").update({ manage_token_hash: bytea(manage.hash) }).eq("story_id", storyId);
      await sendEmail(contact.email, {
        template: "story-published",
        data: {
          name: story.author_display_name,
          songTitle: (story.songs as unknown as { title: string } | null)?.title ?? "your song",
          storyLink: siteUrl(`/stories/${story.public_id}`),
          manageLink: siteUrl(`/manage/${manage.token}`),
        },
      });
    }
  }
  updateTag(CONTENT_TAG);
  return { ok: true, message: firstPublication ? "Published. The author has been emailed." : "Published again." };
}

export async function rejectStory(raw: { storyId: string; reason?: string; notify?: boolean }): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const parsed = z
    .object({ storyId: id, reason: z.string().trim().max(1000).optional(), notify: z.boolean().default(true) })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Something is wrong with this form." };
  const { storyId, reason, notify } = parsed.data;
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("author_display_name, songs(title)").eq("id", storyId).single();
  await db.from("stories").update({ status: "rejected", rejection_reason: reason || null }).eq("id", storyId);
  await log(user.id, "reject", storyId, { withReason: Boolean(reason) });
  if (notify) {
    const { data: contact } = await db.from("story_contacts").select("email").eq("story_id", storyId).maybeSingle();
    if (contact?.email && story) {
      await sendEmail(contact.email, {
        template: "story-rejected",
        data: {
          name: story.author_display_name,
          songTitle: (story.songs as unknown as { title: string } | null)?.title ?? "your song",
          reason: reason || null,
        },
      });
    }
  }
  updateTag(CONTENT_TAG);
  return { ok: true, message: "Not published." };
}

export async function unpublishStory(storyId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!id.safeParse(storyId).success) return { ok: false, message: "Story not found." };
  await supabaseAdmin().from("stories").update({ status: "unpublished" }).eq("id", storyId);
  await log(user.id, "unpublish", storyId);
  updateTag(CONTENT_TAG);
  return { ok: true, message: "Hidden from the site." };
}

export async function deleteStory(storyId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!id.safeParse(storyId).success) return { ok: false, message: "Story not found." };
  const result = await deleteStoryPermanently(storyId, { actor: user.id, reason: "admin_delete" });
  updateTag(CONTENT_TAG);
  return result.ok ? { ok: true, message: "Deleted permanently." } : { ok: false, message: "Couldn't delete this story." };
}

const editInput = z.object({
  storyId: id,
  songId: z.uuid().optional(),
  title: z.string().trim().max(LIMITS.title),
  bodyText: z.string().trim().max(LIMITS.storyText),
  transcript: z.string().trim().max(LIMITS.transcript),
  pseudonym: z.string().trim().min(1).max(LIMITS.pseudonym),
  placeNote: z.string().trim().max(LIMITS.placeNote),
  tagIds: z.array(z.uuid()).max(6),
  featured: z.boolean(),
});

export async function updateStory(raw: z.input<typeof editInput>): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const parsed = editInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the fields (a name is required)." };
  const e = parsed.data;
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("format, status, transcript").eq("id", e.storyId).single();
  if (!story) return { ok: false, message: "Story not found." };
  if (story.format === "text" && !e.bodyText) return { ok: false, message: "A written story can't be empty." };
  if (story.status === "published" && story.format !== "text" && !e.transcript) {
    return { ok: false, message: "A published voice story needs a transcript." };
  }
  const { error } = await db
    .from("stories")
    .update({
      ...(e.songId ? { song_id: e.songId } : {}),
      title: e.title || null,
      body_text: story.format === "audio" ? null : e.bodyText || null,
      transcript: story.format === "text" ? null : e.transcript || null,
      ...(story.format !== "text" && e.transcript !== (story.transcript ?? "") ? { transcript_source: "admin" } : {}),
      author_display_name: e.pseudonym,
      place_time_note: e.placeNote || null,
      featured: e.featured,
    })
    .eq("id", e.storyId);
  if (error) return { ok: false, message: "Couldn't save. Please try again." };
  await setTags(e.storyId, e.tagIds);
  await log(user.id, "edit", e.storyId);
  updateTag(CONTENT_TAG);
  return { ok: true, message: "Saved." };
}

export async function saveTranscript(storyId: string, transcript: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const parsed = z.object({ storyId: id, transcript: z.string().trim().max(LIMITS.transcript) }).safeParse({ storyId, transcript });
  if (!parsed.success) return { ok: false, message: "The transcript is too long." };
  await supabaseAdmin()
    .from("stories")
    .update({ transcript: parsed.data.transcript || null, transcript_source: "admin" })
    .eq("id", storyId);
  await log(user.id, "transcript", storyId);
  updateTag(CONTENT_TAG);
  return { ok: true, message: "Transcript saved." };
}

/** Contributor edits wait in pending_edit until approved here. */
export async function resolveEdit(storyId: string, approve: boolean): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("pending_edit, format").eq("id", storyId).single();
  const edit = story?.pending_edit as Record<string, string | null> | null;
  if (!edit) return { ok: false, message: "There's no pending edit." };
  if (approve) {
    await db
      .from("stories")
      .update({
        title: edit.title,
        ...(story!.format !== "audio" ? { body_text: edit.body_text } : {}),
        ...(story!.format !== "text" && edit.transcript ? { transcript: edit.transcript, transcript_source: "contributor" } : {}),
        author_display_name: edit.author_display_name ?? undefined,
        place_time_note: edit.place_time_note,
        pending_edit: null,
      })
      .eq("id", storyId);
  } else {
    await db.from("stories").update({ pending_edit: null }).eq("id", storyId);
  }
  await log(user.id, approve ? "edit_approved" : "edit_discarded", storyId);
  updateTag(CONTENT_TAG);
  return { ok: true, message: approve ? "Changes published." : "Changes discarded." };
}

export async function resolveReport(reportId: string, action: "dismiss" | "unpublish" | "delete"): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const db = supabaseAdmin();
  const { data: report } = await db.from("reports").select("story_id").eq("id", reportId).single();
  if (!report) return { ok: false, message: "Report not found." };
  const storyId = report.story_id;
  if (storyId && action === "unpublish") await unpublishStory(storyId);
  if (storyId && action === "delete") await deleteStoryPermanently(storyId, { actor: user.id, reason: "admin_delete" });
  // Resolve every open report about the same story at once.
  const query = db
    .from("reports")
    .update({ status: action === "dismiss" ? "dismissed" : "actioned", resolved_by: user.id, resolved_at: new Date().toISOString() });
  await (storyId ? query.eq("story_id", storyId).eq("status", "open") : query.eq("id", reportId));
  if (storyId && action === "dismiss") {
    // A story auto-hidden by reports comes back online when the reports are dismissed.
    const { data: s } = await db.from("stories").select("status, published_at").eq("id", storyId).maybeSingle();
    if (s?.status === "unpublished" && s.published_at) await db.from("stories").update({ status: "published" }).eq("id", storyId);
  }
  updateTag(CONTENT_TAG);
  return { ok: true, message: action === "dismiss" ? "Dismissed." : action === "unpublish" ? "Story hidden." : "Story deleted." };
}

/** Signed URL so the admin can listen to a recording (pending or published). */
export async function adminAudioUrl(storyId: string): Promise<string | null> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("audio_path").eq("id", storyId).maybeSingle();
  if (!story?.audio_path) return null;
  for (const bucket of ["audio-published", "audio-incoming"]) {
    const { data } = await db.storage.from(bucket).createSignedUrl(story.audio_path, 3600);
    if (data?.signedUrl) return data.signedUrl;
  }
  return null;
}

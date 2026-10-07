"use server";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LIMITS } from "@/config/limits";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { verifyAltcha } from "@/lib/captcha";
import { notifyAdmins, sendEmail, siteUrl } from "@/lib/email";
import { bytea, hashToken, newToken, rateLimit, visitorHash } from "@/lib/security";
import { deleteStoryPermanently } from "@/lib/stories/delete";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MANAGE_COOKIE, managedStoryId } from "./session";

export type ActionState = { status: "idle" | "done" | "error"; message?: string };

/** "Email me my links": always answers the same way, so it can't reveal who has shared stories. */
export async function requestManageLinks(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = z.email().max(254).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", message: "Please enter a valid email address." };
  if (!(await verifyAltcha(formData.get("altcha")))) {
    return { status: "error", message: "The spam check didn't complete. Please wait a moment and try again." };
  }
  const allowed =
    (await rateLimit(`links:${await visitorHash()}`, 3600, 3)) &&
    (await rateLimit(`links-email:${hashToken(email.data)}`, 24 * 3600, 3));
  const done: ActionState = {
    status: "done",
    message: "If we have stories for this address, we've just emailed you their private links.",
  };
  if (!allowed) return done;

  const db = supabaseAdmin();
  const { data: rows } = await db
    .from("story_contacts")
    .select("story_id, stories!inner(status, songs(title))")
    .eq("email", email.data)
    .in("stories.status", ["published", "pending_review", "unpublished"]);
  if (!rows?.length) return done;

  const links: { songTitle: string; manageLink: string }[] = [];
  for (const row of rows) {
    const token = newToken();
    await db.from("story_contacts").update({ manage_token_hash: bytea(token.hash) }).eq("story_id", row.story_id);
    const story = row.stories as unknown as { songs: { title: string } | null };
    links.push({ songTitle: story.songs?.title ?? "your song", manageLink: siteUrl(`/manage/${token.token}`) });
  }
  await sendEmail(email.data, { template: "manage-links", data: { links } });
  return done;
}

const editSchema = z.object({
  title: z.string().trim().max(LIMITS.title),
  bodyText: z.string().trim().max(LIMITS.storyText),
  transcript: z.string().trim().max(LIMITS.transcript),
  pseudonym: z.string().trim().min(1).max(LIMITS.pseudonym),
  placeNote: z.string().trim().max(LIMITS.placeNote),
});

/** Saves an edit for review. The published version stays online until the team approves it. */
export async function submitEdit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const storyId = await managedStoryId();
  if (!storyId) return { status: "error", message: "Your private link has expired. Open it again from your email." };
  const parsed = editSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please check your changes (a name is required)." };
  if (!(await rateLimit(`edit:${storyId}`, 24 * 3600, 10))) {
    return { status: "error", message: "You've sent several edits today. Please try again tomorrow." };
  }
  const db = supabaseAdmin();
  const { data: story } = await db.from("stories").select("format, songs(title)").eq("id", storyId).single();
  const e = parsed.data;
  await db
    .from("stories")
    .update({
      pending_edit: {
        title: e.title || null,
        body_text: story?.format === "audio" ? null : e.bodyText || null,
        transcript: story?.format === "text" ? null : e.transcript || null,
        author_display_name: e.pseudonym,
        place_time_note: e.placeNote || null,
        submitted_at: new Date().toISOString(),
      },
    })
    .eq("id", storyId);
  await notifyAdmins({
    template: "admin-edit-request",
    data: { songTitle: (story?.songs as unknown as { title: string } | null)?.title ?? "a song", adminLink: siteUrl("/admin/queue?tab=edits") },
  });
  return { status: "done", message: "Thank you. We'll review your changes soon; until then the current version stays online." };
}

export async function deleteMyEmail(): Promise<ActionState> {
  const storyId = await managedStoryId();
  if (!storyId) return { status: "error", message: "Your private link has expired." };
  await supabaseAdmin().from("story_contacts").update({ email: null }).eq("story_id", storyId);
  return { status: "done", message: "Your email address has been deleted. This private link keeps working." };
}

export async function deleteMyStory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "DELETE") return { status: "error", message: "Please type DELETE to confirm." };
  const storyId = await managedStoryId();
  if (!storyId) return { status: "error", message: "Your private link has expired." };
  const { data: contact } = await supabaseAdmin().from("story_contacts").select("email").eq("story_id", storyId).maybeSingle();
  const result = await deleteStoryPermanently(storyId, { actor: null, reason: "author_request" });
  if (!result.ok) return { status: "error", message: "Something went wrong. Please try again." };
  updateTag(CONTENT_TAG);
  (await cookies()).delete(MANAGE_COOKIE);
  if (contact?.email) {
    await sendEmail(contact.email, { template: "story-removed", data: { songTitle: result.songTitle ?? "your song" } });
  }
  redirect("/manage/deleted");
}

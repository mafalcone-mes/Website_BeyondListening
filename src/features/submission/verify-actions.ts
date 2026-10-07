"use server";
import { z } from "zod";
import { notifyAdmins, siteUrl } from "@/lib/email";
import { bytea, hashToken, rateLimit, visitorHash } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type VerifyState = { status: "idle" | "confirmed" | "invalid" | "expired" | "waiting-audio" };

/** Contributor confirms their email → the story enters the review queue. */
export async function confirmStory(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = z.string().min(20).max(100).safeParse(formData.get("token"));
  if (!token.success) return { status: "invalid" };
  if (!(await rateLimit(`verify:${await visitorHash()}`, 3600, 30))) return { status: "invalid" };

  const db = supabaseAdmin();
  const { data: contact } = await db
    .from("story_contacts")
    .select("story_id, verification_expires_at, stories(status, format, audio_path)")
    .eq("verification_token_hash", bytea(hashToken(token.data)))
    .maybeSingle();
  if (!contact) return { status: "invalid" };
  if (contact.verification_expires_at && new Date(contact.verification_expires_at) < new Date()) {
    return { status: "expired" };
  }
  const story = contact.stories as unknown as { status: string; format: string; audio_path: string | null };
  if (story.format !== "text" && !story.audio_path) return { status: "waiting-audio" };

  await db
    .from("stories")
    .update({ status: "pending_review", verified_at: new Date().toISOString() })
    .eq("id", contact.story_id)
    .eq("status", "pending_verification");
  await db
    .from("story_contacts")
    .update({ verification_token_hash: null, verification_expires_at: null })
    .eq("story_id", contact.story_id);
  await db.from("moderation_log").insert({ action: "verified", entity_type: "story", entity_id: contact.story_id });

  const { count } = await db.from("stories").select("id", { count: "exact", head: true }).eq("status", "pending_review");
  await notifyAdmins({ template: "admin-new-stories", data: { count: count ?? 1, adminLink: siteUrl("/admin/queue") } });
  return { status: "confirmed" };
}

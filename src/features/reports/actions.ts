"use server";
import { updateTag } from "next/cache";
import { z } from "zod";
import { verifyAltcha } from "@/lib/captcha";
import { notifyAdmins, siteUrl } from "@/lib/email";
import { bytea, rateLimit, visitorHash } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { REASON_LABELS, REASONS } from "./reasons";

const schema = z.object({
  storyId: z.uuid(),
  reason: z.enum(REASONS),
  details: z.string().trim().max(1000).optional(),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
  altcha: z.string().min(1),
});

export type ReportState = { status: "idle" | "sent" | "error"; message?: string };

/** Auto-hide threshold: this many distinct visitors reporting within 24 hours. */
const AUTO_HIDE_REPORTS = 3;

export async function reportStory(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please choose a reason." };
  const { storyId, reason, details } = parsed.data;

  if (!(await verifyAltcha(parsed.data.altcha))) {
    return { status: "error", message: "The spam check didn't complete. Please wait a second and try again." };
  }
  const visitor = await visitorHash();
  if (!(await rateLimit(`report:${visitor}`, 24 * 3600, 5))) {
    return { status: "error", message: "You've sent several reports today. Please contact us directly instead." };
  }

  const db = supabaseAdmin();
  const { data: story } = await db
    .from("stories")
    .select("id, status, songs(title)")
    .eq("id", storyId)
    .maybeSingle();
  if (!story || story.status !== "published") return { status: "sent" };

  await db.from("reports").insert({ story_id: storyId, reason, details: details || null, reporter_ip_hash: bytea(visitor) });

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: recent } = await db
    .from("reports")
    .select("reporter_ip_hash")
    .eq("story_id", storyId)
    .eq("status", "open")
    .gte("created_at", since);
  const distinct = new Set((recent ?? []).map((r) => r.reporter_ip_hash)).size;
  const autoHidden = distinct >= AUTO_HIDE_REPORTS;
  if (autoHidden) {
    await db.from("stories").update({ status: "unpublished" }).eq("id", storyId);
    await db.from("moderation_log").insert({
      action: "auto_hide",
      entity_type: "story",
      entity_id: storyId,
      details: { reports: distinct },
    });
    updateTag(CONTENT_TAG);
  }

  const songTitle = (story.songs as unknown as { title: string } | null)?.title ?? "a song";
  await notifyAdmins(
    { template: "admin-new-report", data: { songTitle, reason: REASON_LABELS[reason], adminLink: siteUrl("/admin/reports"), autoHidden } },
    { throttle: !autoHidden },
  );
  return { status: "sent" };
}

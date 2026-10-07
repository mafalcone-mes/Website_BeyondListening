import "server-only";
import { notifyAdmins, retryEmails, siteUrl } from "@/lib/email";
import { enrichSong } from "@/lib/music";
import { deleteStoryPermanently } from "@/lib/stories/delete";
import { supabaseAdmin } from "@/lib/supabase/admin";

const days = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

/**
 * Daily housekeeping (retention policy from the privacy policy):
 * - unconfirmed submissions older than 72 h → deleted (with recordings)
 * - rejected stories older than 30 days → deleted
 * - visitor hashes, rate-limit counters, caches, old emails → purged
 * - IP-hash salts older than 2 days → deleted (old hashes become unlinkable)
 * - failed emails retried, daily digest for the admin, stale song links refreshed
 * Online, the same job is called once a day (which also keeps a free database awake).
 */
export async function runMaintenance() {
  const db = supabaseAdmin();
  const report: Record<string, number> = {};

  const { data: unverified } = await db.from("stories").select("id").eq("status", "pending_verification").lt("created_at", days(3));
  for (const s of unverified ?? []) await deleteStoryPermanently(s.id, { actor: null, reason: "expired" });
  report.unconfirmedDeleted = unverified?.length ?? 0;

  const { data: rejected } = await db.from("stories").select("id").eq("status", "rejected").lt("updated_at", days(30));
  for (const s of rejected ?? []) await deleteStoryPermanently(s.id, { actor: null, reason: "rejected_cleanup" });
  report.rejectedDeleted = rejected?.length ?? 0;

  const purge = async (table: string, column: string, olderThan: string) => {
    const { count } = await db.from(table).delete({ count: "exact" }).lt(column, olderThan);
    report[`${table}Purged`] = count ?? 0;
  };
  await purge("reaction_events", "created_at", days(30));
  await purge("rate_limits", "window_start", days(2));
  await purge("music_cache", "expires_at", new Date().toISOString());
  await purge("email_outbox", "created_at", days(30));
  await db.from("hash_salts").delete().lt("day", days(2).slice(0, 10));
  await db.from("reports").update({ reporter_ip_hash: null }).lt("created_at", days(30));
  await db.from("story_contacts").update({ submitter_ip_hash: null }).lt("created_at", days(30));

  report.emailsRetried = await retryEmails();

  const { count: waiting } = await db.from("stories").select("id", { count: "exact", head: true }).eq("status", "pending_review");
  if (waiting) {
    await notifyAdmins({ template: "admin-new-stories", data: { count: waiting, adminLink: siteUrl("/admin/queue") } }, { throttle: false });
  }

  // Refresh "Listen on…" links older than 90 days, or songs whose enrichment failed (a few per run).
  const { data: stale } = await db
    .from("songs")
    .select("id")
    .or(`enrichment_status.eq.failed,enrichment_status.eq.pending,updated_at.lt.${days(90)}`)
    .gt("published_story_count", 0)
    .limit(10);
  for (const s of stale ?? []) await enrichSong(s.id);
  report.songsRefreshed = stale?.length ?? 0;

  return report;
}

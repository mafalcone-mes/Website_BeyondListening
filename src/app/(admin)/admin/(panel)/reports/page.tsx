import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { formatDate } from "@/components/ui/utils";
import { requireAdmin } from "@/features/admin/auth";
import { ReportActionsBar } from "@/features/admin/report-actions-bar";
import { REASON_LABELS } from "@/features/reports/reasons";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Reports" };

async function Content() {
  await requireAdmin();
  const { data } = await supabaseAdmin()
    .from("reports")
    .select("id, reason, details, created_at, story_id, stories(id, public_id, title, status, author_display_name, body_text, transcript, songs(title, artist))")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  // One card per story, with every open report about it.
  const byStory = new Map<string, { first: NonNullable<typeof data>[number]; reports: NonNullable<typeof data> }>();
  for (const r of data ?? []) {
    const key = r.story_id ?? r.id;
    const entry = byStory.get(key) ?? { first: r, reports: [] };
    entry.reports.push(r);
    byStory.set(key, entry);
  }
  if (!byStory.size) return <EmptyState title="No open reports">When visitors report a story, it shows up here.</EmptyState>;

  return (
    <ul className="flex flex-col gap-5">
      {[...byStory.values()].map(({ first, reports }) => {
        const story = first.stories as unknown as {
          id: string;
          public_id: string;
          title: string | null;
          status: string;
          author_display_name: string;
          body_text: string | null;
          transcript: string | null;
          songs: { title: string; artist: string };
        } | null;
        return (
          <li key={first.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5">
            {story ? (
              <div>
                <p className="font-display text-xl">
                  {story.title ?? `On “${story.songs.title}”`} <span className="text-base text-fg-muted">· {story.author_display_name}</span>
                </p>
                <p className="text-sm text-fg-muted">
                  {story.songs.title} · {story.songs.artist} ·{" "}
                  <span className={story.status === "published" ? "" : "text-warning"}>{story.status === "unpublished" ? "hidden (several reports)" : story.status}</span>
                </p>
                <p className="mt-3 line-clamp-4 whitespace-pre-line rounded-md bg-surface p-3 font-body">{story.body_text ?? story.transcript}</p>
                <Link href={`/admin/stories/${story.id}`} className="mt-2 inline-block text-sm text-accent underline">
                  Open in the editor
                </Link>
              </div>
            ) : (
              <p className="text-fg-muted">The story no longer exists.</p>
            )}
            <ul className="flex flex-col gap-2">
              {reports.map((r) => (
                <li key={r.id} className="rounded-md border border-border p-3 text-sm">
                  <strong>{REASON_LABELS[r.reason as keyof typeof REASON_LABELS]}</strong> · {formatDate(r.created_at)}
                  {r.details ? <p className="mt-1 text-fg-muted">“{r.details}”</p> : null}
                </li>
              ))}
            </ul>
            <ReportActionsBar reportId={first.id} />
          </li>
        );
      })}
    </ul>
  );
}

export default function ReportsPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl">Reports</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content />
      </Suspense>
    </>
  );
}

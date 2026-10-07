import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cx } from "@/components/ui/utils";
import { requireAdmin } from "@/features/admin/auth";
import { EditReview } from "@/features/admin/edit-review";
import { getAllTags, getPendingEdits, getReviewQueue } from "@/features/admin/queries";
import { ReviewList } from "@/features/admin/review-list";

export const metadata: Metadata = { title: "Review" };

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const tab = (await searchParams).tab === "edits" ? "edits" : "new";
  const [queue, edits, tags] = await Promise.all([getReviewQueue(), getPendingEdits(), getAllTags()]);
  const tabClass = (active: boolean) =>
    cx("inline-flex min-h-11 items-center rounded-full px-4 text-sm", active ? "bg-fg text-bg" : "bg-surface text-fg-muted");
  return (
    <>
      <div className="mb-6 flex gap-2" role="tablist">
        <Link href="/admin/queue" role="tab" aria-selected={tab === "new"} className={tabClass(tab === "new")}>
          New stories ({queue.length})
        </Link>
        <Link href="/admin/queue?tab=edits" role="tab" aria-selected={tab === "edits"} className={tabClass(tab === "edits")}>
          Edits ({edits.length})
        </Link>
      </div>
      {tab === "new" ? (
        <ReviewList stories={queue} tags={tags.filter((t) => t.active).map((t) => ({ id: t.id, label: t.label }))} />
      ) : (
        <EditReview items={edits} />
      )}
    </>
  );
}

export default function QueuePage({ searchParams }: PageProps<"/admin/queue">) {
  return (
    <>
      <h1 className="mb-6 text-4xl">Review</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

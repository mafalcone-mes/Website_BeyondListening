"use client";
import { useState } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { ReviewCard, type ReviewStory } from "./review-card";

/** The queue: approved/rejected stories disappear from the list straight away. */
export function ReviewList({ stories, tags }: { stories: ReviewStory[]; tags: { id: string; label: string }[] }) {
  const [done, setDone] = useState<string[]>([]);
  const remaining = stories.filter((s) => !done.includes(s.id));
  if (!remaining.length) {
    return <EmptyState title="All caught up">No stories are waiting for review. Nice work.</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-muted" aria-live="polite">
        {remaining.length} waiting · oldest first
      </p>
      {remaining.map((s) => (
        <ReviewCard key={s.id} story={s} tags={tags} onDone={(id) => setDone((d) => [...d, id])} />
      ))}
    </div>
  );
}

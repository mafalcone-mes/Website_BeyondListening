"use client";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import type { ReviewStory } from "./review-card";
import { resolveEdit } from "./story-actions";

const FIELDS: [string, string, (s: ReviewStory) => string | null][] = [
  ["title", "Title", (s) => s.title],
  ["author_display_name", "Name", (s) => s.author],
  ["place_time_note", "Where and when", (s) => s.placeNote],
  ["body_text", "Story", (s) => s.bodyText],
  ["transcript", "Transcript", (s) => s.transcript],
];

/** Side-by-side view of a contributor's requested changes. */
export function EditReview({ items }: { items: { story: ReviewStory; edit: Record<string, string | null> }[] }) {
  const [done, setDone] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const remaining = items.filter((i) => !done.includes(i.story.id));
  if (!remaining.length) return <EmptyState title="No edits waiting" />;

  const resolve = (storyId: string, approve: boolean) =>
    start(async () => {
      const r = await resolveEdit(storyId, approve);
      if (r.ok) setDone((d) => [...d, storyId]);
    });

  return (
    <div className="flex flex-col gap-6">
      {remaining.map(({ story, edit }) => (
        <article key={story.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5">
          <p className="font-display text-xl">
            {story.song.title} <span className="text-base text-fg-muted">· {story.author}</span>
          </p>
          {FIELDS.filter(([key, , cur]) => key in edit && (edit[key] ?? "") !== (cur(story) ?? "")).map(([key, label, cur]) => (
            <div key={key} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label} · now</p>
                <p className="mt-1 whitespace-pre-line rounded-md bg-surface p-3 text-sm">{cur(story) || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{label} · requested</p>
                <p className="mt-1 whitespace-pre-line rounded-md bg-accent-soft p-3 text-sm">{edit[key] || "—"}</p>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" disabled={pending} onClick={() => resolve(story.id, false)}>
              Keep the current version
            </Button>
            <Button loading={pending} onClick={() => resolve(story.id, true)}>
              Publish the changes
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

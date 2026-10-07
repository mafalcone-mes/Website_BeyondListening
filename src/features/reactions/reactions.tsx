"use client";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { ReactionBar } from "@/components/patterns/reaction-bar";
import { copy } from "@/content/copy";
import { reactToStory } from "./actions";

const storageKey = (storyId: string) => `bl:reaction:${storyId}`;

function readChoice(storyId: string): string | null {
  try {
    return localStorage.getItem(storageKey(storyId));
  } catch {
    return null;
  }
}
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function writeChoice(storyId: string, key: string | null) {
  try {
    if (key) localStorage.setItem(storageKey(storyId), key);
    else localStorage.removeItem(storageKey(storyId));
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

export function Reactions({
  storyId,
  types,
}: {
  storyId: string;
  types: { key: string; emoji: string; label: string }[];
}) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  // The choice remembered in this browser; `override` holds changes made on this page.
  const stored = useSyncExternalStore(subscribeStorage, () => readChoice(storyId), () => null);
  const [override, setSelected] = useState<string | null | undefined>(undefined);
  const selected = override === undefined ? stored : override;
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/stories/${storyId}/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts(d.counts))
      .catch(() => undefined);
  }, [storyId]);

  const onSelect = (key: string) => {
    const previous = selected;
    const next = previous === key ? null : key;
    // Optimistic update.
    setSelected(next);
    setCounts((c) => {
      if (!c) return c;
      const updated = { ...c };
      if (previous) updated[previous] = Math.max((updated[previous] ?? 1) - 1, 0);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });
    setMessage(null);
    startTransition(async () => {
      const result = await reactToStory({ storyId, key: next, previousKey: previous });
      if (result.ok) {
        setCounts(result.counts);
        writeChoice(storyId, next);
      } else {
        setSelected(previous);
        setMessage(result.message);
        fetch(`/api/stories/${storyId}/reactions`)
          .then((r) => r.json())
          .then((d) => setCounts(d.counts))
          .catch(() => undefined);
      }
    });
  };

  return (
    <ReactionBar
      label={copy.story.reactionsLabel}
      types={types}
      counts={counts}
      selected={selected}
      pending={pending}
      message={message}
      onSelect={onSelect}
    />
  );
}

"use client";
import { cx } from "@/components/ui/utils";

export interface ReactionBarProps {
  label: string;
  types: { key: string; emoji: string; label: string }[];
  counts: Record<string, number> | null;
  selected: string | null;
  pending: boolean;
  message: string | null;
  onSelect: (key: string) => void;
}

/** Row of reaction buttons with public counts. Presentational only. */
export function ReactionBar(p: ReactionBarProps) {
  return (
    <div>
      <p id="reactions-label" className="mb-2 text-sm font-semibold text-fg-muted">
        {p.label}
      </p>
      <div role="group" aria-labelledby="reactions-label" className="flex flex-wrap gap-2">
        {p.types.map((t) => {
          const active = p.selected === t.key;
          const count = p.counts?.[t.key] ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              disabled={p.pending}
              onClick={() => p.onSelect(t.key)}
              className={cx(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-(--duration-fast)",
                active
                  ? "border-accent bg-accent-soft text-fg"
                  : "border-border-strong bg-surface-raised text-fg-muted hover:text-fg",
              )}
            >
              <span aria-hidden className="text-lg leading-none">
                {t.emoji}
              </span>
              <span>{t.label}</span>
              <span className="tabular-nums text-fg-subtle" aria-label={`${count} reactions`}>
                {p.counts ? count : "·"}
              </span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-fg-subtle">
        {p.message}
      </p>
    </div>
  );
}

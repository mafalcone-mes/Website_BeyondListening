"use client";
import { Loader2, Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cx } from "@/components/ui/utils";
import { Artwork } from "./artwork";

export interface SearchOption {
  id: string;
  primary: string;
  secondary?: string;
  artworkUrl?: string | null;
  badge?: string;
  showArtwork?: boolean;
}

export interface SearchGroup {
  label: string;
  /** shown under the group label, e.g. "No stories for this song yet — be the first" */
  hint?: string;
  options: SearchOption[];
}

export interface SearchComboboxProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  open: boolean;
  loading: boolean;
  groups: SearchGroup[];
  activeId: string | null;
  emptyMessage: string | null;
  size?: "md" | "lg";
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (option: SearchOption) => void;
  onHover: (id: string) => void;
}

/** Accessible combobox (ARIA 1.2 pattern). Presentational: all state comes from props. */
export function SearchCombobox(p: SearchComboboxProps) {
  const listId = `${p.id}-list`;
  const lg = p.size === "lg";
  const hasOptions = p.groups.some((g) => g.options.length);
  return (
    <div className="relative w-full">
      <label htmlFor={p.id} className="sr-only">
        {p.label}
      </label>
      <div className="relative">
        <Search
          className={cx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-subtle", lg ? "left-6 size-6" : "left-3.5 size-4")}
          aria-hidden
        />
        <input
          id={p.id}
          type="text"
          role="combobox"
          aria-expanded={p.open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={p.activeId ?? undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={p.placeholder}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          onKeyDown={p.onKeyDown}
          onFocus={p.onFocus}
          onBlur={p.onBlur}
          className={cx(
            "w-full rounded-full border border-border-strong bg-surface-raised text-fg placeholder:text-fg-subtle",
            lg ? "min-h-16 pl-16 pr-14 text-lg shadow-2" : "min-h-10 pl-10 pr-10 text-sm",
          )}
        />
        {p.loading ? (
          <Loader2
            className={cx("absolute top-1/2 -translate-y-1/2 animate-spin text-fg-subtle", lg ? "right-6 size-5" : "right-3.5 size-4")}
            aria-hidden
          />
        ) : null}
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={p.label}
        hidden={!p.open}
        className={cx(
          "absolute inset-x-0 top-full z-(--z-overlay) mt-2 max-h-(--dropdown-max-height) overflow-y-auto rounded-lg border border-border bg-surface-raised p-2 text-left shadow-3",
          lg ? "" : "min-w-80",
        )}
      >
        {p.groups.map((g) =>
          g.options.length || g.hint ? (
            <div key={g.label} role="group" aria-label={g.label} className="py-1">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{g.label}</p>
              {g.hint ? <p className="px-3 pb-2 text-sm text-fg-muted">{g.hint}</p> : null}
              {g.options.map((o) => (
                <div
                  key={o.id}
                  id={o.id}
                  role="option"
                  aria-selected={p.activeId === o.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => p.onSelect(o)}
                  onMouseEnter={() => p.onHover(o.id)}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                    p.activeId === o.id && "bg-surface",
                  )}
                >
                  {o.showArtwork ? <Artwork url={o.artworkUrl ?? null} alt="" className="size-10 rounded-sm" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.primary}</p>
                    {o.secondary ? <p className="truncate text-xs text-fg-muted">{o.secondary}</p> : null}
                  </div>
                  {o.badge ? (
                    <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-fg-muted">{o.badge}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null,
        )}
        {!hasOptions && p.emptyMessage ? <p className="px-3 py-3 text-sm text-fg-muted">{p.emptyMessage}</p> : null}
      </div>
    </div>
  );
}

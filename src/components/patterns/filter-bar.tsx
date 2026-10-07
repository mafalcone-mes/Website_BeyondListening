"use client";
import { cx } from "@/components/ui/utils";

export interface FilterBarProps {
  values: { artist?: string; decade?: number; genre?: string; tag?: string; sort: "newest" | "random" };
  options: { artists: string[]; decades: number[]; genres: string[]; tags: { slug: string; label: string }[] };
  clearHref: string;
  clearLabel: string;
}

const select =
  "min-h-10 w-full rounded-md border border-border-strong bg-surface-raised px-3 text-sm font-normal normal-case tracking-normal text-fg";

/**
 * Archive filters as a plain GET form: works without JavaScript, and with it
 * every change applies immediately. Presentational only.
 */
export function FilterBar({ values, options, clearHref, clearLabel }: FilterBarProps) {
  const active = Boolean(values.artist || values.decade || values.genre || values.tag);
  return (
    <form
      method="get"
      action="/archive"
      onChange={(e) => e.currentTarget.requestSubmit()}
      className="grid grid-cols-2 gap-3 md:grid-cols-5 md:items-end"
      aria-label="Filter stories"
    >
      <Field label="Theme">
        <select name="tag" defaultValue={values.tag ?? ""} className={select}>
          <option value="">All themes</option>
          {options.tags.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Artist">
        <select name="artist" defaultValue={values.artist ?? ""} className={select}>
          <option value="">All artists</option>
          {options.artists.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Decade">
        <select name="decade" defaultValue={values.decade ?? ""} className={select}>
          <option value="">All decades</option>
          {options.decades.map((d) => (
            <option key={d} value={d}>
              {d}s
            </option>
          ))}
        </select>
      </Field>
      <Field label="Genre">
        <select name="genre" defaultValue={values.genre ?? ""} className={select}>
          <option value="">All genres</option>
          {options.genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <input type="hidden" name="sort" value={values.sort} />
      <noscript>
        <button type="submit" className="min-h-10 rounded-md border border-border-strong px-4 text-sm">
          Apply
        </button>
      </noscript>
      <a
        href={clearHref}
        className={cx(
          "col-span-2 inline-flex min-h-10 items-center justify-center text-sm text-accent hover:underline md:col-span-1",
          !active && "invisible",
        )}
      >
        {clearLabel}
      </a>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
      {label}
      {children}
    </label>
  );
}

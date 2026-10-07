import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { cx, formatDate } from "@/components/ui/utils";
import { requireAdmin } from "@/features/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Stories" };

const STATUSES = [
  ["", "All"],
  ["published", "Published"],
  ["pending_review", "Waiting"],
  ["unpublished", "Hidden"],
  ["pending_verification", "Unconfirmed"],
  ["rejected", "Not published"],
] as const;

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Content({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = one(sp.status);
  const q = one(sp.q).trim().slice(0, 80);
  let query = supabaseAdmin()
    .from("stories")
    .select("id, title, author_display_name, status, format, source, featured, created_at, songs(title, artist, artwork_url)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (STATUSES.some(([s]) => s && s === status)) query = query.eq("status", status as "published");
  if (q.length >= 2) {
    const terms = q.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter((w) => w.length > 1).map((w) => `${w}:*`);
    if (terms.length) query = query.textSearch("search_tsv", terms.join(" & "), { config: "english" });
  }
  const { data } = await query;

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-3 sm:flex-row" action="/admin/stories">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search text, titles, names…"
          className="min-h-11 flex-1 rounded-md border border-border-strong bg-surface-raised px-3"
          aria-label="Search stories"
        />
        <input type="hidden" name="status" value={status} />
        <button className="min-h-11 rounded-md bg-fg px-5 text-bg">Search</button>
      </form>
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUSES.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/stories?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cx("inline-flex min-h-10 items-center rounded-full px-4 text-sm", status === value ? "bg-fg text-bg" : "bg-surface text-fg-muted")}
          >
            {label}
          </Link>
        ))}
      </nav>
      <ul className="flex flex-col gap-2">
        {(data ?? []).map((s) => {
          const song = s.songs as unknown as { title: string; artist: string; artwork_url: string | null };
          return (
            <li key={s.id}>
              <Link href={`/admin/stories/${s.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 hover:shadow-1">
                <Artwork url={song.artwork_url} alt="" className="size-12 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {s.title ?? `On “${song.title}”`} {s.featured ? <span className="text-accent">★</span> : null}
                  </p>
                  <p className="truncate text-sm text-fg-muted">
                    {s.author_display_name} · {song.title} · {s.format === "text" ? "text" : "voice"}
                    {s.source === "live_session" ? " · session" : ""} · {formatDate(s.created_at)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs text-fg-muted">
                  {STATUSES.find(([v]) => v === s.status)?.[1] ?? s.status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {(data ?? []).length === 100 ? <p className="text-sm text-fg-subtle">Showing the latest 100. Use search to find older ones.</p> : null}
    </div>
  );
}

export default function StoriesPage({ searchParams }: PageProps<"/admin/stories">) {
  return (
    <>
      <h1 className="mb-6 text-4xl">All stories</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

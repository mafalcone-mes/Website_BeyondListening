import { Flag, Inbox, LayoutGrid, ListMusic, Music, Settings, SmilePlus, Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Home" };

function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x;
}

/** Time windows for the stats (outside render, as the data loading step). */
function windows() {
  const now = Date.now();
  return {
    since: new Date(now - 12 * 7 * 86400_000).toISOString(),
    weekAgo: new Date(now - 7 * 86400_000).toISOString(),
  };
}

async function Dashboard() {
  await requireAdmin();
  const db = supabaseAdmin();
  const { since, weekAgo } = windows();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [waiting, edits, reports, published, voice, thisWeek, reactions, recent] = await Promise.all([
    count(db.from("stories").select("id", { count: "exact", head: true }).eq("status", "pending_review")),
    count(db.from("stories").select("id", { count: "exact", head: true }).not("pending_edit", "is", null)),
    count(db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open")),
    count(db.from("stories").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(db.from("stories").select("id", { count: "exact", head: true }).eq("status", "published").neq("format", "text")),
    count(db.from("stories").select("id", { count: "exact", head: true }).eq("status", "published").gte("published_at", weekAgo)),
    count(db.from("reaction_events").select("id", { count: "exact", head: true }).eq("action", "add").gte("created_at", weekAgo)),
    db.from("stories").select("published_at").eq("status", "published").gte("published_at", since),
  ]);

  const weeks: { label: string; n: number }[] = [];
  const first = weekStart(new Date(since));
  for (let i = 0; i < 12; i++) {
    const d = new Date(first.getTime() + (i + 1) * 7 * 86400_000);
    weeks.push({ label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), n: 0 });
  }
  for (const r of recent.data ?? []) {
    const idx = Math.floor((weekStart(new Date(r.published_at)).getTime() - first.getTime()) / (7 * 86400_000)) - 1;
    if (idx >= 0 && idx < 12) weeks[idx].n += 1;
  }
  const max = Math.max(1, ...weeks.map((w) => w.n));

  const todo = [
    { href: "/admin/queue", label: "Stories to review", n: waiting, icon: Inbox },
    { href: "/admin/queue?tab=edits", label: "Edits to review", n: edits, icon: LayoutGrid },
    { href: "/admin/reports", label: "Open reports", n: reports, icon: Flag },
  ];
  const sections = [
    { href: "/admin/sessions", label: "Sessions & playlists", icon: ListMusic },
    { href: "/admin/stories", label: "All stories", icon: LayoutGrid },
    { href: "/admin/songs", label: "Songs", icon: Music },
    { href: "/admin/tags", label: "Themes", icon: Tags },
    { href: "/admin/reactions", label: "Reactions", icon: SmilePlus },
    { href: "/admin/settings", label: "Settings & export", icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="To do" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {todo.map(({ href, label, n, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 rounded-xl border p-5 ${n ? "border-accent bg-accent-soft" : "border-border bg-surface-raised"}`}
          >
            <Icon className="size-6 text-accent" aria-hidden />
            <span className="flex-1 text-sm">{label}</span>
            <span className="font-display text-3xl tabular-nums">{n}</span>
          </Link>
        ))}
      </section>

      <section aria-label="Numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Published stories", published],
          ["Voice stories", voice],
          ["Published this week", thisWeek],
          ["Reactions this week", reactions],
        ].map(([label, n]) => (
          <div key={label} className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{n}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="chart-title" className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 id="chart-title" className="text-xl">
          Stories published per week
        </h2>
        <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label={weeks.map((w) => `${w.label}: ${w.n}`).join(", ")}>
          {weeks.map((w) => (
            <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs tabular-nums text-fg-subtle">{w.n || ""}</span>
              <span className="w-full rounded-t-sm bg-accent" style={{ height: `${(w.n / max) * 100}%`, minHeight: w.n ? 4 : 1 }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1 text-xs text-fg-subtle" aria-hidden>
          {weeks.map((w, i) => (
            <span key={w.label} className="flex-1 truncate text-center">
              {i % 3 === 0 ? w.label : ""}
            </span>
          ))}
        </div>
      </section>

      <section aria-label="Sections" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {sections.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 hover:shadow-1">
            <Icon className="size-5 text-accent" aria-hidden />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function AdminHome() {
  return (
    <>
      <h1 className="mb-8 text-4xl">Hello</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

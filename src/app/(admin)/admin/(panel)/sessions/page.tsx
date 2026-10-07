import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { formatDate } from "@/components/ui/utils";
import { requireAdmin } from "@/features/admin/auth";
import { NewSessionForm } from "@/features/admin/new-session-form";
import { publicCoverUrl } from "@/lib/supabase/browser-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Sessions" };

async function Content() {
  await requireAdmin();
  const { data } = await supabaseAdmin()
    .from("playlists")
    .select("id, title, session_date, location, published, cover_path, playlist_items(count)")
    .order("session_date", { ascending: false, nullsFirst: true });
  return (
    <div className="flex flex-col gap-8">
      <NewSessionForm today={new Date().toISOString().slice(0, 10)} />
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/sessions/${p.id}`} className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4 hover:shadow-1">
              <Artwork url={publicCoverUrl(p.cover_path)} alt="" className="size-14 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-sm text-fg-muted">
                  {[formatDate(p.session_date), p.location, `${(p.playlist_items as unknown as { count: number }[])[0]?.count ?? 0} tracks`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${p.published ? "bg-accent-soft text-fg" : "bg-surface text-fg-muted"}`}>
                {p.published ? "Published" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl">Sessions</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content />
      </Suspense>
    </>
  );
}

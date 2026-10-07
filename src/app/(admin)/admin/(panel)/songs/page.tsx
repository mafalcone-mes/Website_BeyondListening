import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { SongList } from "@/features/admin/song-editor";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Songs" };

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const q = String((await searchParams).q ?? "").trim().slice(0, 80);
  let query = supabaseAdmin()
    .from("songs")
    .select("id, title, artist, album, release_year, genre, artwork_url, published_story_count, enrichment_status")
    .order("artist")
    .order("title")
    .limit(300);
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,()]/g, "")}%,artist.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  return (
    <>
      <form action="/admin/songs" className="mb-6 flex gap-3">
        <input name="q" defaultValue={q} placeholder="Search songs or artists…" aria-label="Search songs" className="min-h-11 flex-1 rounded-md border border-border-strong bg-surface-raised px-3" />
        <button className="min-h-11 rounded-md bg-fg px-5 text-bg">Search</button>
      </form>
      <SongList
        songs={(data ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          releaseYear: s.release_year,
          genre: s.genre,
          artworkUrl: s.artwork_url,
          storyCount: s.published_story_count,
          enrichment: s.enrichment_status,
        }))}
      />
    </>
  );
}

export default function SongsPage({ searchParams }: PageProps<"/admin/songs">) {
  return (
    <>
      <h1 className="mb-2 text-4xl">Songs</h1>
      <p className="mb-6 text-fg-muted">
        Song details come from music catalogs automatically. Fix anything that&apos;s wrong, or merge two entries for the same song.
      </p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

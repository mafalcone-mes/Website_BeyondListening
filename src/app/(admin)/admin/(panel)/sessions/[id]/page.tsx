import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { SessionBuilder, type SessionData } from "@/features/admin/session-builder";
import { publicCoverUrl } from "@/lib/supabase/browser-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Session" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = supabaseAdmin();
  const { data: p } = await db.from("playlists").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: items } = await db
    .from("playlist_items")
    .select("id, position, songs(id, title, artist, artwork_url), stories(id, title, author_display_name, status)")
    .eq("playlist_id", id)
    .order("position");
  const session: SessionData = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sessionDate: p.session_date,
    location: p.location,
    description: p.description,
    coverUrl: publicCoverUrl(p.cover_path),
    published: p.published,
    items: (items ?? []).map((i) => {
      const song = i.songs as unknown as { id: string; title: string; artist: string; artwork_url: string | null };
      const story = i.stories as unknown as { id: string; title: string | null; author_display_name: string; status: string } | null;
      return {
        id: i.id,
        song: { id: song.id, title: song.title, artist: song.artist, artworkUrl: song.artwork_url },
        story: story ? { id: story.id, title: story.title, author: story.author_display_name, status: story.status } : null,
      };
    }),
  };
  return (
    <>
      <Link href="/admin/sessions" className="text-sm text-fg-muted hover:text-fg">
        ← All sessions
      </Link>
      <h1 className="mb-8 mt-2 text-4xl">{session.title}</h1>
      <SessionBuilder session={session} />
    </>
  );
}

export default function SessionPage({ params }: PageProps<"/admin/sessions/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
      <Content params={params} />
    </Suspense>
  );
}

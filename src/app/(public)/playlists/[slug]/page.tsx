import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlaylistHeader, PlaylistTrackRow } from "@/components/sections/playlist";
import { copy } from "@/content/copy";
import { getPlaylistPage } from "@/features/catalog/queries";
import { PlayButton } from "@/features/player/play-button";
import { previewTrack } from "@/features/player/tracks";

export async function generateMetadata({ params }: PageProps<"/playlists/[slug]">): Promise<Metadata> {
  const data = await getPlaylistPage((await params).slug);
  if (!data) return { title: "Playlist not found" };
  return { title: data.playlist.title, description: data.playlist.description ?? undefined };
}

async function PlaylistContent({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getPlaylistPage((await params).slug);
  if (!data) notFound();
  const { playlist, tracks } = data;
  const queue = tracks.map((t) => previewTrack(t.song));

  return (
    <>
      <PlaylistHeader
        {...playlist}
        playAll={queue.length ? <PlayButton tracks={queue} label={copy.playlists.playAll} size="lg" /> : null}
      />
      <ol className="mt-12 max-w-3xl">
        {tracks.map((t, i) => (
          <PlaylistTrackRow
            key={t.position}
            position={i}
            song={t.song}
            story={t.story}
            removedLabel={copy.playlists.removedStory}
            playButton={<PlayButton tracks={queue} startIndex={i} label={`a preview of ${t.song.title}`} size="sm" variant="outline" />}
          />
        ))}
      </ol>
    </>
  );
}

export default function PlaylistPage({ params }: PageProps<"/playlists/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-surface" aria-hidden />}>
        <PlaylistContent params={params} />
      </Suspense>
    </div>
  );
}

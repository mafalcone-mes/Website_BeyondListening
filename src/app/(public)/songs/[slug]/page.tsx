import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { SongChipList } from "@/components/patterns/song-chip-list";
import { SongHeader } from "@/components/sections/song-header";
import { SectionHeading, StoryGrid } from "@/components/sections/story-grid";
import { LinkButton } from "@/components/ui/link-button";
import { copy } from "@/content/copy";
import { getSongPage } from "@/features/catalog/queries";
import { PlayButton } from "@/features/player/play-button";
import { previewTrack } from "@/features/player/tracks";

export async function generateMetadata({ params }: PageProps<"/songs/[slug]">): Promise<Metadata> {
  const data = await getSongPage((await params).slug);
  if (!data) return { title: "Song not found" };
  const { song } = data;
  return {
    title: `${song.title} — ${song.artist}`,
    description: `${song.storyCount ?? 0} personal stories about “${song.title}” by ${song.artist}.`,
  };
}

async function SongContent({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getSongPage((await params).slug);
  if (!data) notFound();
  const { song, stories, relatedSongs } = data;
  const tellHref = `/submit?song=${song.id}`;

  return (
    <>
      <SongHeader
        title={song.title}
        artist={song.artist}
        album={song.album}
        releaseYear={song.releaseYear}
        genre={song.genre}
        artworkUrl={song.artworkUrl}
        links={song.links}
        playButton={
          song.hasPreviewSource ? (
            <PlayButton tracks={[previewTrack(song)]} label={`a preview of ${song.title}`} size="lg" />
          ) : null
        }
        actions={<LinkButton href={tellHref}>{copy.song.tellYours}</LinkButton>}
      />

      <section className="mt-16">
        <SectionHeading title={copy.song.storiesHeading} />
        {stories.length ? (
          <StoryGrid stories={stories} />
        ) : (
          <EmptyState title={copy.song.noStories} action={<LinkButton href={tellHref}>{copy.song.tellYours}</LinkButton>} />
        )}
      </section>

      {relatedSongs.length ? (
        <section className="mt-16">
          <SectionHeading title={copy.song.relatedHeading} />
          <SongChipList songs={relatedSongs} />
        </section>
      ) : null}
    </>
  );
}

export default function SongPage({ params }: PageProps<"/songs/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-surface" aria-hidden />}>
        <SongContent params={params} />
      </Suspense>
    </div>
  );
}

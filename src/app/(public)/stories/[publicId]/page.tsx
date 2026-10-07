import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { ListenOnLinks } from "@/components/patterns/listen-on-links";
import { SongChipList } from "@/components/patterns/song-chip-list";
import { StoryArticle } from "@/components/sections/story-article";
import { SectionHeading, StoryGrid } from "@/components/sections/story-grid";
import { LinkButton } from "@/components/ui/link-button";
import { copy } from "@/content/copy";
import { getStoryPage } from "@/features/catalog/queries";
import { PlayButton } from "@/features/player/play-button";
import { previewTrack, storyTrack } from "@/features/player/tracks";
import { Reactions } from "@/features/reactions/reactions";
import { ReportButton } from "@/features/reports/report-button";

export async function generateMetadata({ params }: PageProps<"/stories/[publicId]">): Promise<Metadata> {
  const data = await getStoryPage((await params).publicId);
  if (!data) return { title: "Story not found", robots: { index: false } };
  const { story } = data;
  const title = story.title ?? `A story about “${story.song.title}”`;
  const description = (story.bodyText ?? story.transcript ?? "").slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

async function StoryContent({ params }: { params: Promise<{ publicId: string }> }) {
  const data = await getStoryPage((await params).publicId);
  if (!data) notFound();
  const { story, related, relatedSongs, reactionTypes } = data;
  const song = story.song;
  const tellHref = `/submit?song=${song.id}`;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="flex flex-col gap-10 lg:col-span-2">
        <StoryArticle
          title={story.title ?? `On “${song.title}”`}
          bodyText={story.bodyText}
          transcript={story.transcript}
          transcriptLabel={copy.story.transcript}
          format={story.format}
          durationS={story.durationS}
          author={story.author}
          placeTimeNote={story.placeTimeNote}
          publishedAt={story.publishedAt}
          sourceLabel={story.source === "live_session" ? copy.story.sourceLive : copy.story.sourcePublic}
          isLiveSession={story.source === "live_session"}
          playlist={story.playlist}
          tags={story.tags}
          audioPlayer={
            story.format !== "text" ? (
              <PlayButton
                tracks={[storyTrack({ ...story, song })]}
                label={`${story.author}'s recording`}
                size="lg"
              />
            ) : null
          }
        />
        <Reactions storyId={story.id} types={reactionTypes} />
        <div>
          <ReportButton storyId={story.id} />
        </div>
      </div>

      <aside className="flex flex-col gap-6" aria-label="The song">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-5 lg:sticky lg:top-(--header-height)">
          <Artwork url={song.artworkUrl} alt={`Cover of ${song.album ?? song.title}`} className="w-full rounded-md" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/songs/${song.slug}`} className="block truncate font-display text-2xl hover:underline">
                {song.title}
              </Link>
              <p className="text-fg-muted">{song.artist}</p>
              <p className="text-sm text-fg-subtle">{[song.album, song.releaseYear].filter(Boolean).join(" · ")}</p>
            </div>
            {song.hasPreviewSource ? (
              <PlayButton tracks={[previewTrack(song)]} label={`a preview of ${song.title}`} />
            ) : null}
          </div>
          <ListenOnLinks links={song.links} songTitle={song.title} />
        </div>
        <div className="rounded-lg bg-accent-soft p-5">
          <p className="font-display text-xl">{copy.story.alsoHaveOne}</p>
          <LinkButton href={tellHref} className="mt-4 w-full">
            {copy.story.alsoHaveOneCta}
          </LinkButton>
        </div>
      </aside>

      {related.length ? (
        <section className="lg:col-span-3">
          <SectionHeading title={copy.story.relatedHeading} />
          <StoryGrid stories={related} />
        </section>
      ) : null}

      {relatedSongs.length ? (
        <section className="lg:col-span-3">
          <SectionHeading title={copy.story.relatedSongsHeading} />
          <SongChipList songs={relatedSongs} />
        </section>
      ) : null}
    </div>
  );
}

export default function StoryPage({ params }: PageProps<"/stories/[publicId]">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface" aria-hidden />}>
        <StoryContent params={params} />
      </Suspense>
    </div>
  );
}

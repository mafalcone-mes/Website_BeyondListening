import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { formatDate } from "@/components/ui/utils";

export function PlaylistCard({
  slug,
  title,
  sessionDate,
  location,
  description,
  coverUrl,
  trackCount,
}: {
  slug: string;
  title: string;
  sessionDate: string | null;
  location: string | null;
  description: string | null;
  coverUrl: string | null;
  trackCount: number;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface-raised shadow-1 hover:shadow-2">
      <Artwork url={coverUrl} alt="" className="w-full" />
      <div className="flex flex-col gap-2 p-(--card-padding)">
        <h2 className="text-2xl">
          <Link href={`/playlists/${slug}`} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-fg-subtle">
          {[formatDate(sessionDate), location, `${trackCount} songs`].filter(Boolean).join(" · ")}
        </p>
        {description ? <p className="line-clamp-3 text-fg-muted">{description}</p> : null}
      </div>
    </article>
  );
}

export function PlaylistHeader({
  title,
  sessionDate,
  location,
  description,
  coverUrl,
  playAll,
}: {
  title: string;
  sessionDate: string | null;
  location: string | null;
  description: string | null;
  coverUrl: string | null;
  playAll: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
      {coverUrl ? <Artwork url={coverUrl} alt="" className="w-full max-w-64 rounded-lg shadow-2 sm:w-56" /> : null}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Listening session</p>
        <h1 className="text-5xl">{title}</h1>
        <p className="flex flex-wrap gap-4 text-fg-muted">
          {sessionDate ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {formatDate(sessionDate)}
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {location}
            </span>
          ) : null}
        </p>
        {description ? <p className="max-w-reading font-body text-lg text-fg-muted">{description}</p> : null}
        <div>{playAll}</div>
      </div>
    </header>
  );
}

export function PlaylistTrackRow({
  position,
  song,
  story,
  removedLabel,
  playButton,
}: {
  position: number;
  song: { slug: string; title: string; artist: string; artworkUrl: string | null };
  story: { publicId: string; title: string | null; excerpt: string; author: string } | null;
  removedLabel: string;
  playButton: ReactNode;
}) {
  return (
    <li className="flex gap-4 border-b border-border py-5 last:border-b-0">
      <span className="w-6 shrink-0 pt-3 text-right font-mono text-sm text-fg-subtle tabular-nums">{position + 1}</span>
      <Artwork url={song.artworkUrl} alt="" className="size-14 rounded-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/songs/${song.slug}`} className="block truncate font-semibold hover:underline">
              {song.title}
            </Link>
            <p className="truncate text-sm text-fg-muted">{song.artist}</p>
          </div>
          {playButton}
        </div>
        {story ? (
          <details className="mt-3 rounded-md bg-surface p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {story.title ?? "The story"} <span className="font-normal text-fg-muted">· told by {story.author}</span>
            </summary>
            <p className="mt-2 font-body text-fg-muted">{story.excerpt}</p>
            <Link href={`/stories/${story.publicId}`} className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
              Read the full story →
            </Link>
          </details>
        ) : (
          <p className="mt-3 text-sm italic text-fg-subtle">{removedLabel}</p>
        )}
      </div>
    </li>
  );
}

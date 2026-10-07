import type { ReactNode } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { ListenOnLinks } from "@/components/patterns/listen-on-links";

export function SongHeader({
  title,
  artist,
  album,
  releaseYear,
  genre,
  artworkUrl,
  links,
  playButton,
  actions,
  headingLevel = 1,
}: {
  title: string;
  artist: string;
  album: string | null;
  releaseYear: number | null | undefined;
  genre: string | null;
  artworkUrl: string | null;
  links: Record<string, string>;
  playButton: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-end">
      <Artwork url={artworkUrl} alt={`Cover of ${album ?? title}`} className="w-full max-w-64 rounded-lg shadow-2 sm:w-56" />
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Song</p>
          <Heading className={headingLevel === 1 ? "mt-1 text-5xl" : "mt-1 text-3xl"}>{title}</Heading>
          <p className="mt-2 text-xl text-fg-muted">{artist}</p>
          <p className="mt-1 text-sm text-fg-subtle">{[album, releaseYear, genre].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {playButton}
          {actions}
        </div>
        <ListenOnLinks links={links} songTitle={title} />
      </div>
    </section>
  );
}

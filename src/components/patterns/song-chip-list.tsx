import Link from "next/link";
import { Artwork } from "./artwork";

/** Compact list of songs (related songs, playlists). */
export function SongChipList({
  songs,
}: {
  songs: { id: string; slug: string; title: string; artist: string; artworkUrl: string | null; storyCount?: number }[];
}) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((s) => (
        <li key={s.id}>
          <Link
            href={`/songs/${s.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 hover:shadow-1"
          >
            <Artwork url={s.artworkUrl} alt="" className="size-14 rounded-sm" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{s.title}</span>
              <span className="block truncate text-sm text-fg-muted">{s.artist}</span>
              {s.storyCount ? (
                <span className="block text-xs text-fg-subtle">
                  {s.storyCount} {s.storyCount === 1 ? "story" : "stories"}
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

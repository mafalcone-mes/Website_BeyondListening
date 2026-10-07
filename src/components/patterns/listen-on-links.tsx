import { ExternalLink } from "lucide-react";

const LABELS: Record<string, string> = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  youtube: "YouTube",
  youtubeMusic: "YouTube Music",
  tidal: "Tidal",
  deezer: "Deezer",
  amazonMusic: "Amazon Music",
  songlink: "All platforms",
};
const ORDER = ["spotify", "appleMusic", "youtubeMusic", "youtube", "deezer", "tidal", "amazonMusic", "songlink"];

/** Outbound links to the full song on streaming platforms. */
export function ListenOnLinks({ links, songTitle }: { links: Record<string, string>; songTitle: string }) {
  const entries = ORDER.filter((k) => links[k]).map((k) => [k, links[k]] as const);
  if (!entries.length) return null;
  return (
    <nav aria-label={`Listen to ${songTitle} on`}>
      <p className="mb-2 text-sm font-semibold text-fg-muted">Listen to the full song on</p>
      <ul className="flex flex-wrap gap-2">
        {entries.map(([key, url]) => (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong px-3 text-sm hover:bg-surface"
            >
              {LABELS[key]}
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

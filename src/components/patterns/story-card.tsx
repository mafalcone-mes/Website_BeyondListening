import { Mic, Radio } from "lucide-react";
import Link from "next/link";
import { cx, formatTime } from "@/components/ui/utils";
import { Artwork } from "./artwork";
import { TagList } from "./tag-list";

export interface StoryCardProps {
  publicId: string;
  title: string | null;
  excerpt: string;
  format: "text" | "audio" | "text_audio";
  durationS: number | null;
  author: string;
  source: "public" | "live_session";
  song: { title: string; artist: string; artworkUrl: string | null };
  tags: { slug: string; label: string }[];
  /** "<<word>>" marks highlighted search terms */
  snippet?: string;
  variant?: "default" | "feature";
}

function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<<[^>]*>>)/g).map((part, i) =>
        part.startsWith("<<") ? (
          <mark key={i} className="rounded-sm bg-accent-soft px-0.5 text-fg">
            {part.slice(2, -2)}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A story in a list or grid. The whole card is one link (to the story). */
export function StoryCard(p: StoryCardProps) {
  const feature = p.variant === "feature";
  const heading = p.title ?? `On “${p.song.title}”`;
  return (
    <article
      className={cx(
        "group relative flex h-full flex-col gap-4 rounded-lg border border-border bg-surface-raised p-(--card-padding) shadow-1",
        "transition-shadow duration-(--duration-base) hover:shadow-2",
      )}
    >
      <div className="flex items-center gap-3">
        <Artwork url={p.song.artworkUrl} alt="" className="size-12 rounded-sm" />
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold">{p.song.title}</p>
          <p className="truncate text-fg-muted">{p.song.artist}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className={cx("font-display", feature ? "text-2xl" : "text-xl")}>
          <Link href={`/stories/${p.publicId}`} className="after:absolute after:inset-0 after:content-['']">
            {heading}
          </Link>
        </h3>
        <p className={cx("font-body text-fg-muted", feature ? "line-clamp-5 text-lg" : "line-clamp-3")}>
          {p.snippet ? <Highlighted text={p.snippet} /> : p.excerpt}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-subtle">
        <span>by {p.author}</span>
        {p.format !== "text" ? (
          <span className="inline-flex items-center gap-1">
            <Mic className="size-4" aria-hidden />
            <span>Voice{p.durationS ? ` · ${formatTime(p.durationS)}` : ""}</span>
          </span>
        ) : null}
        {p.source === "live_session" ? (
          <span className="inline-flex items-center gap-1">
            <Radio className="size-4" aria-hidden />
            Live session
          </span>
        ) : null}
      </div>
      {p.tags.length ? <TagList tags={p.tags.slice(0, 3)} linked={false} /> : null}
    </article>
  );
}

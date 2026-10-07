import { Mic, Radio, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TagList } from "@/components/patterns/tag-list";
import { formatDate, formatTime } from "@/components/ui/utils";

export interface StoryArticleProps {
  title: string;
  bodyText: string | null;
  transcript: string | null;
  transcriptLabel: string;
  format: "text" | "audio" | "text_audio";
  durationS: number | null;
  author: string;
  placeTimeNote: string | null;
  publishedAt: string;
  sourceLabel: string;
  isLiveSession: boolean;
  playlist: { slug: string; title: string } | null;
  tags: { slug: string; label: string }[];
  /** play button for the voice recording (client component slot) */
  audioPlayer?: ReactNode;
}

/** Plain text → paragraphs (stories are plain text; React escapes everything). */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text
        .split(/\n{2,}|\r\n\r\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mb-5 whitespace-pre-line last:mb-0">
            {p}
          </p>
        ))}
    </div>
  );
}

export function StoryArticle(p: StoryArticleProps) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl">{p.title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-4" aria-hidden />
            {p.author}
          </span>
          {p.placeTimeNote ? <span>{p.placeTimeNote}</span> : null}
          <time dateTime={p.publishedAt} className="text-fg-subtle">
            {formatDate(p.publishedAt)}
          </time>
        </p>
        <p className="inline-flex items-center gap-1.5 text-sm text-fg-subtle">
          {p.isLiveSession ? <Radio className="size-4" aria-hidden /> : null}
          {p.sourceLabel}
          {p.playlist ? (
            <>
              {" · "}
              <Link href={`/playlists/${p.playlist.slug}`} className="text-accent hover:underline">
                {p.playlist.title}
              </Link>
            </>
          ) : null}
        </p>
      </header>

      {p.format !== "text" ? (
        <section aria-label="Voice recording" className="flex items-center gap-4 rounded-lg bg-surface p-4">
          {p.audioPlayer}
          <div className="text-sm">
            <p className="inline-flex items-center gap-1.5 font-semibold">
              <Mic className="size-4" aria-hidden />
              Listen to {p.author} tell it
            </p>
            {p.durationS ? <p className="text-fg-muted">{formatTime(p.durationS)}</p> : null}
          </div>
        </section>
      ) : null}

      {p.bodyText ? <Paragraphs text={p.bodyText} className="font-body text-xl leading-relaxed" /> : null}

      {p.format !== "text" && p.transcript ? (
        <details open={!p.bodyText} className="rounded-lg border border-border p-5">
          <summary className="cursor-pointer font-semibold">{p.transcriptLabel}</summary>
          <Paragraphs text={p.transcript} className="mt-4 font-body text-lg leading-relaxed text-fg-muted" />
        </details>
      ) : null}

      <TagList tags={p.tags} />
    </article>
  );
}

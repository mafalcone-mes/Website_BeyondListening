import { Shuffle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { formatDate } from "@/components/ui/utils";

export function HomeHero({
  eyebrow,
  question,
  intro,
  search,
  footnote,
}: {
  eyebrow: string;
  question: string;
  intro: string;
  search: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-surface">
      <div className="mx-auto flex min-h-(--hero-min-height) max-w-page flex-col justify-center gap-8 px-4 py-16 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
        <h1 className="max-w-4xl text-5xl">{question}</h1>
        <p className="max-w-reading font-body text-xl leading-relaxed text-fg-muted">{intro}</p>
        <div className="max-w-2xl">{search}</div>
        {footnote ? <div className="text-sm text-fg-subtle">{footnote}</div> : null}
      </div>
    </section>
  );
}

export function ProjectStory({ heading, text, link }: { heading: string; text: string; link?: ReactNode }) {
  return (
    <section aria-labelledby="project-story" className="mx-auto w-full max-w-reading px-4">
      <h2 id="project-story" className="text-3xl">
        {heading}
      </h2>
      <p className="mt-4 font-body text-xl leading-relaxed text-fg-muted">{text}</p>
      {link ? <div className="mt-4">{link}</div> : null}
    </section>
  );
}

export function PlaylistTeaser({
  heading,
  playlist,
}: {
  heading: string;
  playlist: { slug: string; title: string; sessionDate: string | null; location: string | null; description: string | null; trackCount: number };
}) {
  return (
    <section aria-labelledby="latest-playlist" className="mx-auto w-full max-w-page px-4">
      <div className="flex flex-col gap-4 rounded-xl bg-player-bg p-8 text-player-fg md:flex-row md:items-center md:justify-between md:p-12">
        <div className="max-w-reading">
          <p className="text-sm uppercase tracking-wide opacity-75">{heading}</p>
          <h2 id="latest-playlist" className="mt-2 text-3xl">
            {playlist.title}
          </h2>
          <p className="mt-2 text-sm opacity-75">
            {[formatDate(playlist.sessionDate), playlist.location, `${playlist.trackCount} songs`].filter(Boolean).join(" · ")}
          </p>
          {playlist.description ? <p className="mt-4 font-body text-lg opacity-90">{playlist.description}</p> : null}
        </div>
        <Link
          href={`/playlists/${playlist.slug}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-player-fg px-6 font-medium text-player-bg hover:opacity-90"
        >
          Open the playlist
        </Link>
      </div>
    </section>
  );
}

export function RandomStoryCta({ heading, text, cta }: { heading: string; text: string; cta: string }) {
  return (
    <section className="mx-auto flex w-full max-w-reading flex-col items-center gap-4 px-4 text-center">
      <h2 className="text-3xl">{heading}</h2>
      <p className="text-fg-muted">{text}</p>
      <LinkButton href="/random" variant="secondary" size="lg" prefetch={false}>
        <Shuffle className="size-5" aria-hidden />
        {cta}
      </LinkButton>
    </section>
  );
}

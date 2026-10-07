import { copy } from "@/content/copy";
import { Button } from "@/components/ui/button";

/* Phase 0 placeholder. The real home page (hero search, stories, playlists) comes in Phase 1. */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <p className="bg-accent-soft px-4 py-2 text-center text-sm text-fg-muted">
        {copy.prototype.banner}
      </p>
      <section className="mx-auto flex w-full max-w-reading flex-1 flex-col justify-center gap-8 px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {copy.site.name}
        </p>
        <h1 className="text-5xl">{copy.hero.question}</h1>
        <p className="font-body text-xl leading-relaxed text-fg-muted">{copy.site.tagline}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            aria-label={copy.hero.searchPlaceholder}
            placeholder={copy.hero.searchPlaceholder}
            disabled
            className="min-h-13 flex-1 rounded-full border border-border-strong bg-surface-raised px-6 text-lg text-fg placeholder:text-fg-subtle"
          />
          <Button size="lg" disabled>
            {copy.hero.searchCta}
          </Button>
        </div>
        <p className="text-sm text-fg-subtle">
          The site is being built. See the <a className="underline" href="/styleguide">styleguide</a>.
        </p>
      </section>
    </main>
  );
}

import { Shuffle } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { FilterBar } from "@/components/patterns/filter-bar";
import { StoryGrid } from "@/components/sections/story-grid";
import { LinkButton } from "@/components/ui/link-button";
import { copy } from "@/content/copy";
import { ARCHIVE_PAGE_SIZE, getArchive, getArchiveFacets } from "@/features/catalog/queries";
import type { ArchiveFilters } from "@/features/catalog/types";

export const metadata: Metadata = {
  title: "Archive",
  description: copy.archive.intro,
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

function parseFilters(sp: Search): ArchiveFilters {
  const decade = Number(one(sp.decade));
  const page = Math.min(Math.max(Number(one(sp.page)) || 1, 1), 50);
  const sort = one(sp.sort) === "random" ? "random" : "newest";
  return {
    artist: one(sp.artist)?.slice(0, 300),
    decade: Number.isInteger(decade) && decade >= 1900 ? decade : undefined,
    genre: one(sp.genre)?.slice(0, 60),
    tag: one(sp.tag)?.slice(0, 40),
    sort,
    seed: sort === "random" ? (one(sp.seed)?.slice(0, 12) ?? "start") : undefined,
    page,
  };
}

function toQuery(f: ArchiveFilters, patch: Partial<ArchiveFilters> = {}) {
  const merged = { ...f, ...patch };
  const params = new URLSearchParams();
  if (merged.tag) params.set("tag", merged.tag);
  if (merged.artist) params.set("artist", merged.artist);
  if (merged.decade) params.set("decade", String(merged.decade));
  if (merged.genre) params.set("genre", merged.genre);
  if (merged.sort === "random") {
    params.set("sort", "random");
    if (merged.seed) params.set("seed", merged.seed);
  }
  if (merged.page > 1) params.set("page", String(merged.page));
  const s = params.toString();
  return s ? `/archive?${s}` : "/archive";
}

const newSeed = () => Math.random().toString(36).slice(2, 8);

async function Results({ searchParams }: { searchParams: Promise<Search> }) {
  await connection(); // per-request (the shuffle seed is random)
  const filters = parseFilters(await searchParams);
  const [{ total, items }, facets] = await Promise.all([getArchive(filters), getArchiveFacets()]);
  const shown = items.length;

  return (
    <>
      <div className="flex flex-col gap-6 border-b border-border pb-6">
        <FilterBar
          values={filters}
          options={facets}
          clearHref={toQuery({ sort: filters.sort, seed: filters.seed, page: 1 })}
          clearLabel={copy.archive.clear}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-fg-muted" aria-live="polite">
            {total === 1 ? "1 story" : `${total} stories`}
          </p>
          <div className="flex items-center gap-2" role="group" aria-label="Order">
            <LinkButton
              href={toQuery(filters, { sort: "newest", seed: undefined, page: 1 })}
              size="sm"
              variant={filters.sort === "newest" ? "primary" : "ghost"}
              aria-current={filters.sort === "newest" ? "true" : undefined}
              scroll={false}
            >
              Newest
            </LinkButton>
            <LinkButton
              href={toQuery(filters, { sort: "random", seed: newSeed(), page: 1 })}
              size="sm"
              variant={filters.sort === "random" ? "primary" : "ghost"}
              aria-current={filters.sort === "random" ? "true" : undefined}
              scroll={false}
              prefetch={false}
            >
              <Shuffle className="size-4" aria-hidden />
              {filters.sort === "random" ? copy.archive.reshuffle : copy.archive.shuffle}
            </LinkButton>
          </div>
        </div>
      </div>

      {shown ? (
        <StoryGrid stories={items} className="mt-8" />
      ) : (
        <EmptyState
          className="mt-8"
          title={copy.archive.empty}
          action={
            <LinkButton href="/archive" variant="secondary">
              {copy.archive.clear}
            </LinkButton>
          }
        />
      )}

      {shown < total ? (
        <div className="mt-10 flex flex-col items-center gap-2">
          <LinkButton href={toQuery(filters, { page: filters.page + 1 })} variant="secondary" scroll={false}>
            {copy.archive.loadMore}
          </LinkButton>
          <p className="text-xs text-fg-subtle">
            Showing {shown} of {total}
          </p>
        </div>
      ) : null}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: Math.min(ARCHIVE_PAGE_SIZE, 6) }, (_, i) => (
        <li key={i} className="h-64 animate-pulse rounded-lg bg-surface" />
      ))}
    </ul>
  );
}

export default function ArchivePage({ searchParams }: PageProps<"/archive">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12">
      <header className="mb-8 max-w-reading">
        <h1 className="text-4xl">{copy.archive.title}</h1>
        <p className="mt-3 font-body text-lg text-fg-muted">{copy.archive.intro}</p>
      </header>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

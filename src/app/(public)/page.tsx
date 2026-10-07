import Link from "next/link";
import { HomeHero, PlaylistTeaser, ProjectStory, RandomStoryCta } from "@/components/sections/home";
import { SectionHeading, StoryGrid } from "@/components/sections/story-grid";
import { EmptyState } from "@/components/patterns/empty-state";
import { copy } from "@/content/copy";
import { getHomeData } from "@/features/catalog/queries";
import { SearchBox } from "@/features/search/search-box";

export default async function HomePage() {
  const data = await getHomeData();
  const seeAll = (
    <Link href="/archive" className="text-sm font-medium text-accent hover:underline">
      {copy.home.seeAll} →
    </Link>
  );

  return (
    <>
      <p className="bg-accent-soft px-4 py-2 text-center text-sm text-fg-muted">{copy.prototype.banner}</p>
      <HomeHero
        eyebrow={copy.site.name}
        question={copy.hero.question}
        intro={copy.hero.intro}
        search={<SearchBox mode="submit" size="lg" />}
        footnote={data.storyCount ? `${data.storyCount} stories shared so far.` : null}
      />

      <div className="flex flex-col gap-24 py-20">
        {data.projectStory ? (
          <ProjectStory
            heading={copy.home.projectHeading}
            text={data.projectStory}
            link={
              <Link href="/about" className="font-medium text-accent hover:underline">
                Read more about the project →
              </Link>
            }
          />
        ) : null}

        {data.featured.length ? (
          <section className="mx-auto w-full max-w-page px-4">
            <SectionHeading title={copy.home.featuredHeading} action={seeAll} />
            <StoryGrid stories={data.featured} variant="feature" />
          </section>
        ) : null}

        {data.latestPlaylist ? <PlaylistTeaser heading={copy.home.playlistHeading} playlist={data.latestPlaylist} /> : null}

        <section className="mx-auto w-full max-w-page px-4">
          <SectionHeading title={copy.home.recentHeading} action={seeAll} />
          {data.recent.length ? (
            <StoryGrid stories={data.recent} />
          ) : (
            <EmptyState title="No stories yet">Be the first: search for your song above.</EmptyState>
          )}
        </section>

        {data.storyCount ? (
          <RandomStoryCta heading={copy.home.randomHeading} text={copy.home.randomText} cta={copy.home.randomCta} />
        ) : null}
      </div>
    </>
  );
}

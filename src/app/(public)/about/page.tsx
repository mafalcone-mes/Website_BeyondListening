import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import { copy } from "@/content/copy";
import { getHomeData } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "About", description: copy.site.tagline };

export default async function AboutPage() {
  const { projectStory, storyCount } = await getHomeData();
  return (
    <article className="mx-auto w-full max-w-reading px-4 py-12">
      <h1 className="text-4xl">About {copy.site.name}</h1>
      <p className="mt-6 font-body text-xl leading-relaxed">{projectStory ?? copy.site.tagline}</p>
      <h2 className="mt-12 text-2xl">How it works</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-fg-muted">
        <li>Pick a song that holds a story for you.</li>
        <li>Write your story, or record it in your own voice. Recordings get an automatic transcript you can correct.</li>
        <li>Confirm your email. We read every story before it&apos;s published.</li>
        <li>Your story joins the archive. You get a private link to edit or remove it whenever you want.</li>
      </ol>
      <h2 className="mt-12 text-2xl">Listening sessions</h2>
      <p className="mt-4 text-fg-muted">{copy.playlists.intro}</p>
      <h2 className="mt-12 text-2xl">Privacy, in one paragraph</h2>
      <p className="mt-4 text-fg-muted">
        Your email is never shown. We don&apos;t track visitors or use advertising cookies. You can remove your story at any
        time. Songs are never hosted here: we only play 30-second previews from Deezer and Apple, and link to the full songs.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/submit">{copy.nav.share}</LinkButton>
        <LinkButton href="/archive" variant="secondary">
          Browse {storyCount} stories
        </LinkButton>
      </div>
    </article>
  );
}

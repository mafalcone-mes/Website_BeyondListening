import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveTags } from "@/features/catalog/queries";
import { getSongForSubmission } from "@/features/submission/actions";
import { SubmitWizardLoader } from "@/features/submission/submit-wizard-loader";

export const metadata: Metadata = {
  title: "Share your story",
  description: "Tell the story a song holds for you, in writing or in your own voice.",
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Wizard({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const songId = one(sp.song);
  const provider = one(sp.provider);
  const pid = one(sp.pid);
  const [song, tags] = await Promise.all([songId ? getSongForSubmission(songId) : null, getActiveTags()]);
  const pick =
    !song && pid && (provider === "deezer" || provider === "itunes" || provider === "mock")
      ? { provider: provider as "deezer" | "itunes" | "mock", providerId: pid }
      : null;
  return <SubmitWizardLoader initialSong={song} pick={pick} tags={tags} />;
}

export default function SubmitPage({ searchParams }: PageProps<"/submit">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Share your story</p>
        <h1 className="mt-2 text-4xl">A song, and what it holds for you</h1>
        <p className="mt-3 font-body text-lg text-fg-muted">
          Write it or record it in your own voice. It takes about five minutes, and you can remove it at any time.
        </p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface" aria-hidden />}>
        <Wizard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

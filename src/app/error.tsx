"use client";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

/** Shown when something unexpected fails while rendering a page. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="content" className="mx-auto flex w-full max-w-reading flex-1 flex-col justify-center gap-6 px-4 py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Something went wrong</p>
      <h1 className="text-5xl">This page didn&apos;t load.</h1>
      <p className="font-body text-xl text-fg-muted">It&apos;s probably temporary. Please try again in a moment.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">
          Home
        </LinkButton>
      </div>
    </main>
  );
}

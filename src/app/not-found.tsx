import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <main id="content" className="mx-auto flex w-full max-w-reading flex-1 flex-col items-start justify-center gap-6 px-4 py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Not found</p>
      <h1 className="text-5xl">This page isn&apos;t here.</h1>
      <p className="font-body text-xl text-fg-muted">
        If you followed a link to a story, it may have been removed by its author.
      </p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/archive">Browse the archive</LinkButton>
        <LinkButton href="/" variant="secondary">
          Home
        </LinkButton>
      </div>
      <Link href="/random" className="text-sm text-accent hover:underline" prefetch={false}>
        Or read a random story →
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = { title: "Story deleted", robots: { index: false } };

export default function DeletedPage() {
  return (
    <div role="status" className="mx-auto flex w-full max-w-reading flex-col gap-4 px-4 py-20">
      <h1 className="text-4xl">Your story has been deleted.</h1>
      <p className="font-body text-lg text-fg-muted">
        The text, the recording and your email are gone from the site. Copies in our encrypted backups disappear within 30
        days. Thank you for having shared it.
      </p>
      <LinkButton href="/" variant="secondary" className="self-start">
        Home
      </LinkButton>
    </div>
  );
}

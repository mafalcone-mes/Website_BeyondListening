import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { serverEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default function SentPage() {
  const env = serverEnv();
  const localInbox = env.EMAIL_PROVIDER === "local" ? (env.LOCAL_INBOX_URL ?? null) : null;
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 py-20">
      <MailCheck className="size-12 text-accent" aria-hidden />
      <h1 className="text-4xl">Almost there: check your email</h1>
      <p className="font-body text-xl text-fg-muted">
        We sent you a link to confirm your story. Once you confirm, we&apos;ll read it and publish it in the archive.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-fg-muted">
        <li>The link works for 72 hours.</li>
        <li>Can&apos;t find it? Look in your spam or promotions folder.</li>
        {localInbox ? (
          <li>
            Local prototype: emails aren&apos;t really sent. Open the{" "}
            <a className="text-accent underline" href={localInbox} target="_blank" rel="noreferrer">
              local inbox
            </a>{" "}
            to find the link.
          </li>
        ) : null}
      </ul>
      <div className="flex gap-3">
        <LinkButton href="/archive" variant="secondary">
          Browse the archive while you wait
        </LinkButton>
      </div>
    </div>
  );
}

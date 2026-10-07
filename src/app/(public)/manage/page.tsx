import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestLinksForm } from "./request-form";

export const metadata: Metadata = { title: "Manage my story", robots: { index: false } };

async function InvalidNotice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (!sp.invalid) return null;
  return (
    <p role="alert" className="rounded-md border border-danger p-3 text-sm text-danger">
      That private link doesn&apos;t work anymore (a newer one may have been sent). Ask for a new one below.
    </p>
  );
}

export default function ManagePage({ searchParams }: PageProps<"/manage">) {
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 py-16">
      <h1 className="text-4xl">Manage my story</h1>
      <p className="font-body text-lg text-fg-muted">
        Every story has a private link to edit or remove it. We sent it to you when your story was published. Lost it? Enter
        your email and we&apos;ll send fresh links.
      </p>
      <Suspense>
        <InvalidNotice searchParams={searchParams} />
      </Suspense>
      <RequestLinksForm />
    </div>
  );
}

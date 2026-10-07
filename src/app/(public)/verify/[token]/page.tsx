import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = { title: "Confirm your story", robots: { index: false }, referrer: "no-referrer" };

/* Confirmation needs a click (not just opening the link), so email link scanners can't confirm by accident. */
async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ConfirmForm token={token} />;
}

export default function VerifyPage({ params }: PageProps<"/verify/[token]">) {
  return (
    <div className="mx-auto w-full max-w-reading px-4 py-20">
      <Suspense>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

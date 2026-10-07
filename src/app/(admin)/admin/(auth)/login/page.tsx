import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/copy";
import { serverEnv } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

async function Notice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (sp.denied) return <p role="alert" className="text-sm text-danger">This account doesn&apos;t have admin access.</p>;
  if (sp.expired) return <p role="alert" className="text-sm text-danger">That login link has expired or was already used. Ask for a new one.</p>;
  return null;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const env = serverEnv();
  const localInbox = env.EMAIL_PROVIDER === "local" ? (env.LOCAL_INBOX_URL ?? null) : null;
  return (
    <main id="content" className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div>
        <p className="font-display text-2xl">{copy.site.name}</p>
        <h1 className="mt-1 text-4xl">Admin</h1>
      </div>
      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>
      <LoginForm localInbox={localInbox} />
      {localInbox ? (
        <p className="text-xs text-fg-subtle">
          Local prototype: log in with <strong>{process.env.ADMIN_EMAIL ?? "admin@beyond-listening.local"}</strong>. The link
          arrives in the local inbox.
        </p>
      ) : null}
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { managedStoryId } from "@/features/manage/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DeletePanel, EditPanel, EmailPanel, type ManagedStory } from "./manage-panels";

export const metadata: Metadata = { title: "Manage my story", robots: { index: false }, referrer: "no-referrer" };

const STATUS: Record<string, string> = {
  pending_review: "Waiting for review",
  published: "Published",
  unpublished: "Hidden while we review it",
  pending_verification: "Waiting for your email confirmation",
  rejected: "Not published",
};

async function Content() {
  const storyId = await managedStoryId();
  if (!storyId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl">Your private link has expired</h1>
        <p className="text-fg-muted">
          For your security, an opened link works for two hours. Open it again from your email, or ask for a new one.
        </p>
        <LinkButton href="/manage" className="self-start">
          Get a new link
        </LinkButton>
      </div>
    );
  }
  const db = supabaseAdmin();
  const [{ data: s }, { data: contact }] = await Promise.all([
    db
      .from("stories")
      .select("public_id, status, format, title, body_text, transcript, author_display_name, place_time_note, pending_edit, songs(title, artist)")
      .eq("id", storyId)
      .single(),
    db.from("story_contacts").select("email").eq("story_id", storyId).single(),
  ]);
  if (!s) return null;
  const song = s.songs as unknown as { title: string; artist: string };
  const story: ManagedStory = {
    format: s.format,
    title: s.title ?? "",
    bodyText: s.body_text ?? "",
    transcript: s.transcript ?? "",
    pseudonym: s.author_display_name,
    placeNote: s.place_time_note ?? "",
    hasEmail: Boolean(contact?.email),
    hasPendingEdit: Boolean(s.pending_edit),
  };
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl">Manage your story</h1>
        <p className="text-lg text-fg-muted">
          About “{song.title}” by {song.artist} · <span className="font-semibold text-fg">{STATUS[s.status] ?? s.status}</span>
        </p>
        {s.status === "published" ? (
          <LinkButton href={`/stories/${s.public_id}`} variant="secondary" size="sm" className="self-start">
            View it on the site
          </LinkButton>
        ) : null}
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Edit</h2>
        <EditPanel story={story} />
      </section>
      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="text-2xl">Your email address</h2>
        <EmailPanel hasEmail={story.hasEmail} />
      </section>
      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="text-2xl">Delete your story</h2>
        <DeletePanel />
      </section>
    </div>
  );
}

export default function ManageStoryPage() {
  return (
    <div className="mx-auto w-full max-w-reading px-4 py-16">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface" aria-hidden />}>
        <Content />
      </Suspense>
    </div>
  );
}

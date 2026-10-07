import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { getAllTags, getStoryForEditor } from "@/features/admin/queries";
import { StoryEditor } from "@/features/admin/story-editor";

export const metadata: Metadata = { title: "Edit story" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [data, tags] = await Promise.all([getStoryForEditor(id), getAllTags()]);
  if (!data) notFound();
  return (
    <>
      <Link href="/admin/stories" className="text-sm text-fg-muted hover:text-fg">
        ← All stories
      </Link>
      <h1 className="mb-8 mt-2 text-4xl">{data.story.title ?? `${data.story.author} on “${data.story.song.title}”`}</h1>
      <StoryEditor data={data} tags={tags.filter((t) => t.active).map((t) => ({ id: t.id, label: t.label }))} />
    </>
  );
}

export default function EditStoryPage({ params }: PageProps<"/admin/stories/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
      <Content params={params} />
    </Suspense>
  );
}

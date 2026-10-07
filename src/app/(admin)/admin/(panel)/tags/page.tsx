import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { TagEditor } from "@/features/admin/list-editors";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Themes" };

async function Content() {
  await requireAdmin();
  const { data } = await supabaseAdmin().from("tags").select("id, label, description, active, story_tags(count)").order("sort_order");
  const items = (data ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    extra: t.description ?? "",
    active: t.active,
    count: (t.story_tags as unknown as { count: number }[])[0]?.count ?? 0,
  }));
  return <TagEditor items={items} />;
}

export default function TagsPage() {
  return (
    <>
      <h1 className="mb-2 text-4xl">Themes</h1>
      <p className="mb-6 text-fg-muted">Contributors pick up to three themes for their story. Visitors use them to browse the archive.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content />
      </Suspense>
    </>
  );
}

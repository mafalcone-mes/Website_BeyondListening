import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { ReactionEditor } from "@/features/admin/list-editors";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Reactions" };

async function Content() {
  await requireAdmin();
  const { data } = await supabaseAdmin().from("reaction_types").select("id, emoji, label, active").order("sort_order");
  return <ReactionEditor items={(data ?? []).map((r) => ({ id: r.id, label: r.label, extra: r.emoji, active: r.active }))} />;
}

export default function ReactionsPage() {
  return (
    <>
      <h1 className="mb-2 text-4xl">Reactions</h1>
      <p className="mb-6 text-fg-muted">The buttons visitors can press under a story (up to six at a time). Hiding one keeps its counts.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content />
      </Suspense>
    </>
  );
}

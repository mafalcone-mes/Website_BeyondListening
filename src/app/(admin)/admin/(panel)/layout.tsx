import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/copy";
import { AdminFrame } from "@/features/admin/admin-frame";
import { requireAdmin } from "@/features/admin/auth";
import { logout } from "@/features/admin/login-actions";

export const metadata: Metadata = { title: { default: "Admin", template: `%s · Admin` }, robots: { index: false } };

async function Guarded({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const [queue, edits, reports] = await Promise.all([
    supabase.from("stories").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("stories").select("id", { count: "exact", head: true }).not("pending_edit", "is", null),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return (
    <AdminFrame
      siteName={copy.site.name}
      logout={
        <form action={logout}>
          <button type="submit" className="px-3 text-sm text-fg-muted hover:text-fg">
            Log out
          </button>
        </form>
      }
      nav={[
        { href: "/admin", label: "Home", icon: "home", primary: true },
        { href: "/admin/queue", label: "Review", icon: "queue", badge: (queue.count ?? 0) + (edits.count ?? 0), primary: true },
        { href: "/admin/sessions", label: "Sessions", icon: "sessions", primary: true },
        { href: "/admin/reports", label: "Reports", icon: "reports", badge: reports.count ?? 0, primary: true },
        { href: "/admin/stories", label: "Stories", icon: "stories", primary: true },
        { href: "/admin/songs", label: "Songs", icon: "songs" },
        { href: "/admin/tags", label: "Themes", icon: "tags" },
        { href: "/admin/reactions", label: "Reactions", icon: "reactions" },
        { href: "/admin/settings", label: "Settings", icon: "settings" },
      ]}
    >
      {children}
    </AdminFrame>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-svh animate-pulse bg-surface" aria-label="Loading" />}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}

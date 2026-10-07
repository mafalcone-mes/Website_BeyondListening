import { Flag, Home, Inbox, LayoutGrid, ListMusic, Music, Settings, SmilePlus, Tags } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/utils";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: "home" | "queue" | "stories" | "sessions" | "reports" | "tags" | "reactions" | "songs" | "settings";
  badge?: number;
  /** shown in the phone's bottom bar */
  primary?: boolean;
}

const ICONS = {
  home: Home,
  queue: Inbox,
  stories: LayoutGrid,
  sessions: ListMusic,
  reports: Flag,
  tags: Tags,
  reactions: SmilePlus,
  songs: Music,
  settings: Settings,
};

/**
 * Admin layout: sidebar on larger screens, a bottom tab bar on phones
 * (big touch targets for use during live sessions).
 */
export function AdminShell({
  siteName,
  nav,
  current,
  logout,
  children,
}: {
  siteName: string;
  nav: AdminNavItem[];
  current: string;
  logout: ReactNode;
  children: ReactNode;
}) {
  const isActive = (href: string) => (href === "/admin" ? current === "/admin" : current.startsWith(href));
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4 md:flex">
        <Link href="/admin" className="mb-6 px-3 font-display text-xl">
          {siteName} <span className="block text-xs font-normal uppercase tracking-wide text-fg-subtle">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                  isActive(item.href) ? "bg-surface-raised font-semibold shadow-1" : "text-fg-muted hover:bg-surface-raised",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-accent px-2 text-xs text-accent-fg">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 pt-6 text-sm">
          <Link href="/" className="px-3 text-fg-muted hover:text-fg">
            View the site →
          </Link>
          {logout}
        </div>
      </aside>

      <header className="sticky top-0 z-(--z-nav) flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/admin" className="font-display text-lg">
          {siteName} <span className="text-xs uppercase tracking-wide text-fg-subtle">Admin</span>
        </Link>
        {logout}
      </header>

      <main id="content" className="flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-(--z-nav) grid grid-cols-5 border-t border-border bg-surface-raised pb-(--safe-area-bottom) md:hidden"
      >
        {nav
          .filter((i) => i.primary)
          .map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cx(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs",
                  isActive(item.href) ? "font-semibold text-accent" : "text-fg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
                {item.badge ? (
                  <span className="absolute right-1/4 top-2 rounded-full bg-accent px-1.5 text-xs leading-5 text-accent-fg">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}

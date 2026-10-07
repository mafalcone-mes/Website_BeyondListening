import Link from "next/link";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/link-button";

export interface SiteHeaderProps {
  siteName: string;
  nav: { href: string; label: string }[];
  shareLabel: string;
  skipLabel: string;
  /** The search box (a client component) is passed in as a slot. */
  search: ReactNode;
}

export function SiteHeader({ siteName, nav, shareLabel, skipLabel, search }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-nav) border-b border-border bg-bg/90 backdrop-blur">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2"
      >
        {skipLabel}
      </a>
      <div className="mx-auto flex min-h-(--header-height) max-w-page flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          {siteName}
        </Link>
        <nav aria-label="Main" className="ml-auto flex gap-5 text-sm md:ml-0">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-fg-muted hover:text-fg">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="order-last w-full md:order-none md:ml-auto md:w-auto md:max-w-md md:flex-1">{search}</div>
        <div className="hidden md:block">
          <LinkButton href="/submit" size="sm">
            {shareLabel}
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

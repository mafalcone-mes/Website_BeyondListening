import Link from "next/link";

export function SiteFooter({
  siteName,
  note,
  links,
}: {
  siteName: string;
  note: string;
  links: { href: string; label: string }[];
}) {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-reading">
          <p className="font-display text-xl">{siteName}</p>
          <p className="mt-2 text-sm text-fg-muted">{note}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-fg-muted hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

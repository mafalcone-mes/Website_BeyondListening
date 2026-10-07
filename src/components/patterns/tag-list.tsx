import Link from "next/link";
import { cx } from "@/components/ui/utils";

export function TagList({
  tags,
  linked = true,
  className,
}: {
  tags: { slug: string; label: string }[];
  linked?: boolean;
  className?: string;
}) {
  if (!tags.length) return null;
  const chip = "inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-fg-muted";
  return (
    <ul className={cx("flex flex-wrap gap-2", className)} aria-label="Themes">
      {tags.map((t) => (
        <li key={t.slug}>
          {linked ? (
            <Link href={`/archive?tag=${t.slug}`} className={cx(chip, "hover:text-fg")}>
              {t.label}
            </Link>
          ) : (
            <span className={chip}>{t.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

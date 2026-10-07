import { Disc3 } from "lucide-react";
import { cx } from "@/components/ui/utils";

/**
 * Square album artwork from the music provider's CDN, with a neutral fallback.
 * A plain <img> on purpose: provider URLs are already sized, so image
 * optimization quotas are never used for artwork.
 */
export function Artwork({ url, alt, className }: { url: string | null; alt: string; className?: string }) {
  if (!url) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={cx("flex aspect-square shrink-0 items-center justify-center bg-surface-sunken text-fg-subtle", className)}
      >
        <Disc3 className="size-1/2" aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cx("aspect-square shrink-0 bg-surface-sunken object-cover", className)}
    />
  );
}

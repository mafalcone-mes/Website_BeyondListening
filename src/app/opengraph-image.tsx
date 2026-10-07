import { copy } from "@/content/copy";
import { ogImage, ogSize } from "@/lib/og";

export const alt = copy.site.tagline;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ eyebrow: "An archive of song stories", title: copy.hero.question, subtitle: copy.site.tagline });
}

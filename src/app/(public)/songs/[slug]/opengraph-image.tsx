import { getSongPage } from "@/features/catalog/queries";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "A song on Beyond Listening";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getSongPage((await params).slug);
  if (!data) return ogImage({ eyebrow: "Song", title: "Beyond Listening" });
  const n = data.stories.length;
  return ogImage({
    eyebrow: `${n} ${n === 1 ? "story" : "stories"}`,
    title: data.song.title,
    subtitle: data.song.artist,
    artworkUrl: data.song.artworkUrl,
  });
}

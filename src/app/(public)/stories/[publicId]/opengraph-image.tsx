import { getStoryPage } from "@/features/catalog/queries";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "A story on Beyond Listening";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ publicId: string }> }) {
  const data = await getStoryPage((await params).publicId);
  if (!data) return ogImage({ eyebrow: "Story", title: "Beyond Listening" });
  const { story } = data;
  return ogImage({
    eyebrow: `A story by ${story.author}`,
    title: story.title ?? `On “${story.song.title}”`,
    subtitle: `${story.song.title} · ${story.song.artist}`,
    artworkUrl: story.song.artworkUrl,
  });
}

import { getPlaylistPage } from "@/features/catalog/queries";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "A listening session on Beyond Listening";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getPlaylistPage((await params).slug);
  if (!data) return ogImage({ eyebrow: "Listening session", title: "Beyond Listening" });
  return ogImage({
    eyebrow: "Listening session",
    title: data.playlist.title,
    subtitle: `${data.tracks.length} songs, ${data.tracks.length} stories`,
    artworkUrl: data.playlist.coverUrl ?? data.tracks[0]?.song.artworkUrl,
  });
}

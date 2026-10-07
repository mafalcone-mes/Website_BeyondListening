// Builds player tracks. Plain module: usable from server and client components.

/** Something the global player can play. URLs are resolved right before playing. */
export interface Track {
  key: string;
  kind: "preview" | "story";
  /** song id (preview) or story id (story audio) */
  id: string;
  title: string;
  subtitle: string;
  artworkUrl: string | null;
  href: string | null;
}

export function previewTrack(song: {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
}): Track {
  return {
    key: `preview:${song.id}`,
    kind: "preview",
    id: song.id,
    title: song.title,
    subtitle: song.artist,
    artworkUrl: song.artworkUrl,
    href: `/songs/${song.slug}`,
  };
}

export function storyTrack(story: {
  id: string;
  publicId: string;
  title: string | null;
  author: string;
  song: { title: string; artist: string; artworkUrl: string | null };
}): Track {
  return {
    key: `story:${story.id}`,
    kind: "story",
    id: story.id,
    title: story.title ?? `${story.author} on “${story.song.title}”`,
    subtitle: `Told by ${story.author}`,
    artworkUrl: story.song.artworkUrl,
    href: `/stories/${story.publicId}`,
  };
}

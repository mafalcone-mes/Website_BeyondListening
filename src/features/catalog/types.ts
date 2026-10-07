export interface SongSummary {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  releaseYear?: number | null;
  storyCount?: number;
}

export interface TagRef {
  slug: string;
  label: string;
}

/** Shape returned by the story_card() SQL function. */
export interface StoryCardData {
  id: string;
  publicId: string;
  title: string | null;
  excerpt: string;
  format: "text" | "audio" | "text_audio";
  durationS: number | null;
  author: string;
  source: "public" | "live_session";
  publishedAt: string;
  song: SongSummary;
  tags: TagRef[];
  snippet?: string;
}

export interface SongDetail extends SongSummary {
  album: string | null;
  genre: string | null;
  decade: number | null;
  links: Record<string, string>;
  hasPreviewSource: boolean;
}

export interface StoryDetail {
  id: string;
  publicId: string;
  title: string | null;
  bodyText: string | null;
  format: StoryCardData["format"];
  durationS: number | null;
  peaks: number[] | null;
  transcript: string | null;
  author: string;
  placeTimeNote: string | null;
  source: StoryCardData["source"];
  publishedAt: string;
  song: SongDetail;
  tags: TagRef[];
  playlist: { slug: string; title: string } | null;
}

export interface PlaylistSummary {
  id: string;
  slug: string;
  title: string;
  sessionDate: string | null;
  location: string | null;
  description: string | null;
  coverUrl: string | null;
  trackCount: number;
}

export interface PlaylistTrack {
  position: number;
  song: SongSummary;
  story: StoryCardData | null;
}

export interface ArchiveFilters {
  artist?: string;
  decade?: number;
  genre?: string;
  tag?: string;
  sort: "newest" | "random";
  seed?: string;
  page: number;
}

export interface ArchiveFacets {
  artists: string[];
  decades: number[];
  genres: string[];
  tags: TagRef[];
}

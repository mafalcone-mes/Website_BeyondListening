export type MusicProviderId = "deezer" | "itunes" | "mock";

/** A song as returned by an external catalog search (not yet in our DB). */
export interface CatalogResult {
  provider: MusicProviderId;
  providerId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  releaseYear: number | null;
  hasPreview: boolean;
}

/** Full details used when saving a song. */
export interface CatalogTrack extends CatalogResult {
  isrc: string | null;
  genre: string | null;
  deezerId: number | null;
  itunesId: number | null;
}

export interface PreviewSource {
  url: string | null;
  provider: MusicProviderId | null;
  attribution: string | null;
}

export interface ExternalLinks {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  youtubeMusic?: string;
  tidal?: string;
  deezer?: string;
  amazonMusic?: string;
  songlink?: string;
  fetchedAt?: string;
}

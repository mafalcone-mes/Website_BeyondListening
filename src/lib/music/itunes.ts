import "server-only";
import { getJson, yearOf } from "./http";
import type { CatalogResult, CatalogTrack } from "./types";

/*
 * iTunes Search API (no key). Apple asks for roughly ≤ 20 calls/minute.
 * Previews must link back to Apple Music and must not be downloaded or stored.
 */

const API = "https://itunes.apple.com";

interface ItTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
}

const bigArtwork = (url?: string) => url?.replace(/\/\d+x\d+bb\./, "/1000x1000bb.") ?? null;

function toResult(t: ItTrack): CatalogResult {
  return {
    provider: "itunes",
    providerId: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName ?? null,
    artworkUrl: bigArtwork(t.artworkUrl100),
    releaseYear: yearOf(t.releaseDate),
    hasPreview: Boolean(t.previewUrl),
  };
}

async function search(q: string, limit: number) {
  const res = await getJson<{ results?: ItTrack[] }>(
    `${API}/search?term=${encodeURIComponent(q)}&entity=song&limit=${limit}`,
  );
  return res?.results ?? null;
}

export async function itunesSearch(q: string, limit = 10): Promise<CatalogResult[] | null> {
  const results = await search(q, limit);
  return results ? results.map(toResult) : null;
}

async function lookup(id: string | number): Promise<ItTrack | null> {
  const res = await getJson<{ results?: ItTrack[] }>(`${API}/lookup?id=${id}`);
  return res?.results?.[0] ?? null;
}

export async function itunesTrack(id: string | number): Promise<CatalogTrack | null> {
  const t = await lookup(id);
  if (!t) return null;
  return { ...toResult(t), isrc: null, genre: t.primaryGenreName ?? null, deezerId: null, itunesId: t.trackId };
}

/** Finds the iTunes equivalent of a song (used for genre and as a preview fallback). */
export async function itunesMatch(
  artist: string,
  title: string,
  match: (a: string, t: string) => boolean,
): Promise<ItTrack | null> {
  const results = await search(`${artist} ${title}`, 10);
  return results?.find((r) => match(r.artistName, r.trackName)) ?? null;
}

export async function itunesPreview(id: string | number): Promise<string | null> {
  return (await lookup(id))?.previewUrl ?? null;
}

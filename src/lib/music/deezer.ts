import "server-only";
import { getJson, yearOf } from "./http";
import type { CatalogResult, CatalogTrack } from "./types";

/*
 * Deezer public API (no key). Limit: 50 requests / 5 s per IP.
 * Preview URLs are signed and expire, so they're resolved at play time and
 * never stored. Attribution: "Preview courtesy of Deezer".
 */

const API = "https://api.deezer.com";

interface DzTrack {
  id: number;
  title: string;
  title_short?: string;
  isrc?: string;
  preview?: string;
  rank?: number;
  release_date?: string;
  artist: { name: string };
  album: { id: number; title: string; cover_medium?: string; cover_xl?: string; release_date?: string };
}
interface DzList<T> {
  data?: T[];
  error?: unknown;
}
interface DzAlbum {
  release_date?: string;
  genres?: { data?: { name: string }[] };
}

function toResult(t: DzTrack): CatalogResult {
  return {
    provider: "deezer",
    providerId: String(t.id),
    title: t.title_short || t.title,
    artist: t.artist.name,
    album: t.album?.title ?? null,
    artworkUrl: t.album?.cover_xl ?? t.album?.cover_medium ?? null,
    releaseYear: yearOf(t.album?.release_date ?? t.release_date),
    hasPreview: Boolean(t.preview),
  };
}

export async function deezerSearch(q: string, limit = 10): Promise<CatalogResult[] | null> {
  const res = await getJson<DzList<DzTrack>>(
    `${API}/search/track?q=${encodeURIComponent(q)}&limit=${Math.min(limit * 2, 25)}`,
  );
  if (!res || res.error || !res.data) return null;
  return res.data.map(toResult);
}

export async function deezerTrack(id: string | number): Promise<CatalogTrack | null> {
  const t = await getJson<DzTrack & { error?: unknown }>(`${API}/track/${id}`);
  if (!t || t.error || !t.id) return null;
  const album = await getJson<DzAlbum>(`${API}/album/${t.album.id}`);
  return {
    ...toResult(t),
    releaseYear: yearOf(album?.release_date ?? t.release_date),
    isrc: t.isrc ?? null,
    genre: album?.genres?.data?.[0]?.name ?? null,
    deezerId: t.id,
    itunesId: null,
  };
}

export async function deezerPreview(id: string | number): Promise<string | null> {
  const t = await getJson<DzTrack & { error?: unknown }>(`${API}/track/${id}`);
  return t && !t.error && t.preview ? t.preview : null;
}

export function deezerTrackUrl(id: string | number) {
  return `https://www.deezer.com/track/${id}`;
}

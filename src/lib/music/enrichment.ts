import "server-only";
import { getJson, yearOf } from "./http";
import type { ExternalLinks } from "./types";

/*
 * MusicBrainz (open data, CC0): original release year + recording id.
 * Limit: 1 request/second with a descriptive User-Agent (see http.ts).
 * Odesli / song.link: cross-platform "Listen on…" links. 10 requests/minute without a key.
 */

interface MbRecording {
  id: string;
  score?: number;
  "first-release-date"?: string;
}

export async function musicbrainzByIsrc(
  isrc: string,
): Promise<{ musicbrainzId: string; releaseYear: number | null } | null> {
  const res = await getJson<{ recordings?: MbRecording[] }>(
    `https://musicbrainz.org/ws/2/recording?query=isrc:${encodeURIComponent(isrc)}&fmt=json&limit=5`,
    8000,
  );
  const recordings = res?.recordings ?? [];
  if (!recordings.length) return null;
  const years = recordings.map((r) => yearOf(r["first-release-date"])).filter((y): y is number => y !== null);
  return { musicbrainzId: recordings[0].id, releaseYear: years.length ? Math.min(...years) : null };
}

interface OdesliResponse {
  pageUrl?: string;
  linksByPlatform?: Record<string, { url: string }>;
}

const PLATFORMS: Record<string, keyof ExternalLinks> = {
  spotify: "spotify",
  appleMusic: "appleMusic",
  youtube: "youtube",
  youtubeMusic: "youtubeMusic",
  tidal: "tidal",
  deezer: "deezer",
  amazonMusic: "amazonMusic",
};

export async function odesliLinks(sourceUrl: string): Promise<ExternalLinks | null> {
  const res = await getJson<OdesliResponse>(
    `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(sourceUrl)}&userCountry=IT`,
    8000,
  );
  if (!res?.linksByPlatform) return null;
  const links: ExternalLinks = { songlink: res.pageUrl, fetchedAt: new Date().toISOString() };
  for (const [platform, key] of Object.entries(PLATFORMS)) {
    const url = res.linksByPlatform[platform]?.url;
    if (url) (links as Record<string, string>)[key] = url;
  }
  return links;
}

/** Links that always work, even without Odesli (search pages on each platform). */
export function fallbackLinks(artist: string, title: string): ExternalLinks {
  const q = encodeURIComponent(`${artist} ${title}`);
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    appleMusic: `https://music.apple.com/search?term=${q}`,
    youtubeMusic: `https://music.youtube.com/search?q=${q}`,
  };
}

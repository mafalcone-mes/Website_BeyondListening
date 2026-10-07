import "server-only";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deezerPreview, deezerSearch, deezerTrack, deezerTrackUrl } from "./deezer";
import { fallbackLinks, musicbrainzByIsrc, odesliLinks } from "./enrichment";
import { itunesMatch, itunesPreview, itunesSearch, itunesTrack } from "./itunes";
import { mockSearch, mockTrack } from "./mock";
import { normalizeText, slugify, songNormKey } from "./normalize";
import type { CatalogResult, CatalogTrack, ExternalLinks, MusicProviderId, PreviewSource } from "./types";

export type { CatalogResult, ExternalLinks, PreviewSource } from "./types";

// ─── small DB cache (music_cache table) ────────────────────────────────

async function cacheGet<T>(key: string): Promise<T | null> {
  const { data } = await supabaseAdmin()
    .from("music_cache")
    .select("payload, expires_at")
    .eq("key", key)
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data.payload as T;
}

async function cacheSet(key: string, payload: unknown, ttlSeconds: number) {
  await supabaseAdmin()
    .from("music_cache")
    .upsert({ key, payload, expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString() });
}

// ─── search ─────────────────────────────────────────────────────────────

const ALT_VERSION =
  /\b(remix(es|ed)?|live|acoustic|session|karaoke|instrumental|tribute|cover|sped up|slowed|8-bit|lullaby)\b/i;

/** True when every word the visitor typed appears in "artist title". */
function matchesAllWords(r: CatalogResult, words: string[]) {
  const hay = normalizeText(`${r.artist} ${r.title}`);
  return words.every((w) => hay.includes(w));
}

/**
 * Keeps the provider's relevance order, but lists results matching everything
 * typed first (e.g. "nina simone feeling good" → Nina Simone before covers),
 * and original recordings before remixes, covers and live versions.
 */
function rank(results: CatalogResult[], q: string): CatalogResult[] {
  const words = normalizeText(q).split(" ").filter(Boolean);
  const score = (r: CatalogResult) =>
    (matchesAllWords(r, words) ? 2 : 0) + (ALT_VERSION.test(`${r.title} ${r.album ?? ""}`) ? 0 : 1);
  return results
    .map((r, i) => ({ r, i, s: score(r) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.r);
}

/** Same song from the same artist appears once (first = best). */
function dedupeResults(results: CatalogResult[]): CatalogResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = songNormKey(r.artist, r.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchCatalog(q: string, limit = 8): Promise<CatalogResult[]> {
  const query = q.trim().slice(0, 80);
  if (query.length < 2) return [];
  const provider = serverEnv().MUSIC_PROVIDER;
  if (provider === "mock") return mockSearch(query, limit);

  const key = `search:${normalizeText(query)}`;
  const cached = await cacheGet<CatalogResult[]>(key);
  if (cached) return cached.slice(0, limit);

  let raw = (await deezerSearch(query, limit)) ?? [];
  const words = normalizeText(query).split(" ").filter(Boolean);
  const strong = raw.filter((r) => matchesAllWords(r, words) && !ALT_VERSION.test(`${r.title} ${r.album ?? ""}`));
  if (strong.length === 0) {
    // Deezer found nothing convincing: add Apple's results (they often rank originals better).
    raw = [...raw, ...((await itunesSearch(query, limit)) ?? [])];
  }
  const results = dedupeResults(rank(raw, query)).slice(0, limit);
  if (results.length) await cacheSet(key, results, 24 * 3600);
  return results;
}

// ─── saving a song (deduplicated) ───────────────────────────────────────

const GENRE_RULES: [RegExp, string][] = [
  [/hip.?hop|rap/i, "Hip-hop"],
  [/r&b|rnb|soul|funk/i, "R&B / Soul"],
  [/alternative|indie/i, "Alternative"],
  [/electro|dance|house|techno/i, "Electronic"],
  [/singer|songwriter|folk/i, "Folk"],
  [/metal/i, "Metal"],
  [/rock/i, "Rock"],
  [/jazz/i, "Jazz"],
  [/blues/i, "Blues"],
  [/reggae/i, "Reggae"],
  [/classical/i, "Classical"],
  [/country/i, "Country"],
  [/latin/i, "Latin"],
  [/soundtrack|film/i, "Soundtrack"],
  [/pop|italian|chanson|variet/i, "Pop"],
];

export function normalizeGenre(name: string | null | undefined): string | null {
  if (!name) return null;
  return GENRE_RULES.find(([re]) => re.test(name))?.[1] ?? name.slice(0, 60);
}

async function fetchTrack(provider: MusicProviderId, id: string): Promise<CatalogTrack | null> {
  if (provider === "mock") return mockTrack(id);
  if (provider === "deezer") return deezerTrack(id);
  return itunesTrack(id);
}

export interface SavedSong {
  id: string;
  slug: string;
  created: boolean;
}

/**
 * Finds or creates our song record for a catalog result.
 * Matching order: provider id → ISRC → normalized "artist::title".
 */
export async function upsertSong(provider: MusicProviderId, providerId: string): Promise<SavedSong | null> {
  const track = await fetchTrack(provider, providerId);
  if (!track) return null;
  const db = supabaseAdmin();
  const normKey = songNormKey(track.artist, track.title);

  const lookups: [string, string | number | null][] = [
    ["deezer_id", track.deezerId],
    ["itunes_id", track.itunesId],
    ["isrc", track.isrc],
    ["norm_key", normKey],
  ];
  for (const [column, value] of lookups) {
    if (value === null || value === undefined) continue;
    const { data } = await db
      .from("songs")
      .select("id, slug, deezer_id, itunes_id, isrc")
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (data) {
      // Fill in identifiers we didn't have yet (e.g. matched by name, now we know the Deezer id).
      // A unique-index clash (another song already has that id) is simply ignored.
      const patch: Record<string, unknown> = {};
      if (track.deezerId && !data.deezer_id) patch.deezer_id = track.deezerId;
      if (track.itunesId && !data.itunes_id) patch.itunes_id = track.itunesId;
      if (track.isrc && !data.isrc) patch.isrc = track.isrc;
      if (Object.keys(patch).length) await db.from("songs").update(patch).eq("id", data.id);
      return { id: data.id, slug: data.slug, created: false };
    }
  }

  const suffix = Math.random().toString(36).slice(2, 6);
  const { data, error } = await db
    .from("songs")
    .insert({
      slug: `${slugify(`${track.artist} ${track.title}`)}-${suffix}`,
      title: track.title.slice(0, 300),
      artist: track.artist.slice(0, 300),
      album: track.album?.slice(0, 300) ?? null,
      release_year: track.releaseYear,
      genre: normalizeGenre(track.genre),
      isrc: track.isrc,
      deezer_id: track.deezerId,
      itunes_id: track.itunesId,
      norm_key: normKey,
      artwork_url: track.artworkUrl,
      enrichment_status: provider === "mock" ? "done" : "pending",
    })
    .select("id, slug")
    .single();
  if (error) {
    // A concurrent request may have inserted the same song: retry the lookup once.
    if (error.code === "23505") return upsertSong(provider, providerId);
    throw new Error(`song insert failed: ${error.message}`);
  }
  return { id: data.id, slug: data.slug, created: true };
}

// ─── enrichment (runs after the response) ───────────────────────────────

const sameSong = (artist: string, title: string) => (a: string, t: string) =>
  songNormKey(a, t) === songNormKey(artist, title) ||
  (normalizeText(a).includes(normalizeText(artist)) && normalizeText(t).startsWith(normalizeText(title)));

export async function enrichSong(songId: string): Promise<void> {
  if (serverEnv().MUSIC_PROVIDER === "mock") return;
  const db = supabaseAdmin();
  const { data: song } = await db.from("songs").select("*").eq("id", songId).single();
  if (!song) return;

  const patch: Record<string, unknown> = {};
  try {
    if (song.isrc && !song.musicbrainz_id) {
      const mb = await musicbrainzByIsrc(song.isrc);
      if (mb) {
        const { data: clash } = await db.from("songs").select("id").eq("musicbrainz_id", mb.musicbrainzId).maybeSingle();
        if (!clash) patch.musicbrainz_id = mb.musicbrainzId;
        if (mb.releaseYear && (!song.release_year || mb.releaseYear < song.release_year)) {
          patch.release_year = mb.releaseYear;
        }
      }
    }

    if (!song.itunes_id || !song.genre) {
      const match = await itunesMatch(song.artist, song.title, sameSong(song.artist, song.title));
      if (match) {
        if (!song.itunes_id) {
          const { data: clash } = await db.from("songs").select("id").eq("itunes_id", match.trackId).maybeSingle();
          if (!clash) patch.itunes_id = match.trackId;
        }
        if (match.primaryGenreName) patch.genre = normalizeGenre(match.primaryGenreName);
      }
    }

    const sourceUrl = song.deezer_id
      ? deezerTrackUrl(song.deezer_id)
      : song.itunes_id ?? patch.itunes_id
        ? `https://music.apple.com/song/${song.itunes_id ?? patch.itunes_id}`
        : null;
    const links = sourceUrl ? await odesliLinks(sourceUrl) : null;
    patch.external_links = links ?? { ...fallbackLinks(song.artist, song.title), fetchedAt: new Date().toISOString() };
    patch.enrichment_status = "done";
  } catch {
    patch.enrichment_status = "failed";
  }
  await db.from("songs").update(patch).eq("id", songId);
}

// ─── previews (resolved at play time, never stored as files) ────────────

export async function resolvePreview(songId: string): Promise<PreviewSource> {
  const none: PreviewSource = { url: null, provider: null, attribution: null };
  if (serverEnv().MUSIC_PROVIDER === "mock") return none;

  const key = `preview:${songId}`;
  const cached = await cacheGet<PreviewSource>(key);
  if (cached) return cached;

  const { data: song } = await supabaseAdmin()
    .from("songs")
    .select("deezer_id, itunes_id, artist, title")
    .eq("id", songId)
    .maybeSingle();
  if (!song) return none;

  let result = none;
  const fromDeezer = song.deezer_id ? await deezerPreview(song.deezer_id) : null;
  if (fromDeezer) {
    result = { url: fromDeezer, provider: "deezer", attribution: "Preview courtesy of Deezer" };
  } else {
    const fromItunes = song.itunes_id
      ? await itunesPreview(song.itunes_id)
      : (await itunesMatch(song.artist, song.title, sameSong(song.artist, song.title)))?.previewUrl;
    if (fromItunes) result = { url: fromItunes, provider: "itunes", attribution: "Preview courtesy of Apple Music" };
  }
  // Deezer preview links expire; 10 minutes is well within their lifetime.
  await cacheSet(key, result, result.url ? 600 : 3600);
  return result;
}

/** Links for "Listen on…", with search-page fallbacks when Odesli has nothing. */
export function listenLinks(song: { artist: string; title: string; external_links: ExternalLinks | null }) {
  const links = { ...fallbackLinks(song.artist, song.title), ...(song.external_links ?? {}) };
  delete links.fetchedAt;
  return links;
}

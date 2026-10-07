import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listenLinks } from "@/lib/music";
import { supabasePublic } from "@/lib/supabase/public";
import { serverEnv } from "@/lib/env";
import type {
  ArchiveFacets,
  ArchiveFilters,
  PlaylistSummary,
  PlaylistTrack,
  SongDetail,
  SongSummary,
  StoryCardData,
  StoryDetail,
} from "./types";

/*
 * All public reads. Results are cached and tagged "content": any admin change
 * (publish, edit, delete…) calls updateTag("content"), so pages refresh at once.
 * At this archive's size, one tag for everything is simpler and just as fast.
 */
export const CONTENT_TAG = "content";
export const ARCHIVE_PAGE_SIZE = 24;

function cached() {
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
}

function db() {
  return supabasePublic();
}

function coverUrl(path: string | null) {
  if (!path) return null;
  return `${serverEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

// ─── home ───────────────────────────────────────────────────────────────

export async function getHomeData() {
  "use cache";
  cached();
  const [featured, recent, playlists, settings, counts] = await Promise.all([
    db().rpc("featured_stories", { p_limit: 3 }),
    db().rpc("archive_stories", { p_limit: 6 }),
    getPlaylists(),
    db().from("site_settings").select("project_story").maybeSingle(),
    db().from("stories").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  return {
    featured: (featured.data ?? []) as StoryCardData[],
    recent: (recent.data?.items ?? []) as StoryCardData[],
    latestPlaylist: playlists[0] ?? null,
    projectStory: settings.data?.project_story ?? null,
    storyCount: counts.count ?? 0,
  };
}

// ─── archive ────────────────────────────────────────────────────────────

export async function getArchive(filters: ArchiveFilters) {
  "use cache";
  cached();
  const { data, error } = await db().rpc("archive_stories", {
    p_artist: filters.artist ?? null,
    p_decade: filters.decade ?? null,
    p_genre: filters.genre ?? null,
    p_tag: filters.tag ?? null,
    p_sort: filters.sort,
    p_seed: filters.seed ?? null,
    p_limit: ARCHIVE_PAGE_SIZE * filters.page,
    p_offset: 0,
  });
  if (error) throw new Error(error.message);
  return { total: data.total as number, items: data.items as StoryCardData[] };
}

export async function getArchiveFacets(): Promise<ArchiveFacets> {
  "use cache";
  cached();
  const { data } = await db().rpc("archive_facets");
  return data ?? { artists: [], decades: [], genres: [], tags: [] };
}

// ─── songs ──────────────────────────────────────────────────────────────

const SONG_COLUMNS =
  "id, slug, title, artist, album, release_year, decade, genre, artwork_url, external_links, deezer_id, itunes_id, published_story_count";

type SongRow = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album: string | null;
  release_year: number | null;
  decade: number | null;
  genre: string | null;
  artwork_url: string | null;
  external_links: Record<string, string> | null;
  deezer_id: number | null;
  itunes_id: number | null;
  published_story_count: number;
};

function toSongDetail(row: SongRow): SongDetail {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    artist: row.artist,
    album: row.album,
    artworkUrl: row.artwork_url,
    releaseYear: row.release_year,
    decade: row.decade,
    genre: row.genre,
    storyCount: row.published_story_count,
    links: listenLinks({ artist: row.artist, title: row.title, external_links: row.external_links }) as Record<
      string,
      string
    >,
    hasPreviewSource: Boolean(row.deezer_id || row.itunes_id) || serverEnv().MUSIC_PROVIDER !== "mock",
  };
}

export async function getSongPage(slug: string) {
  "use cache";
  cached();
  const { data: row } = await db().from("songs").select(SONG_COLUMNS).eq("slug", slug).maybeSingle();
  if (!row) return null;
  const song = toSongDetail(row as SongRow);
  const [{ data: storyIds }, related] = await Promise.all([
    db()
      .from("stories")
      .select("id")
      .eq("song_id", song.id)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    db().rpc("related_songs", { p_song: song.id, p_limit: 6 }),
  ]);
  const stories = await storyCards((storyIds ?? []).map((s) => s.id));
  return { song, stories, relatedSongs: (related.data ?? []) as SongSummary[] };
}

/** Cards for the given published stories, in the given order. */
async function storyCards(ids: string[]): Promise<StoryCardData[]> {
  if (!ids.length) return [];
  const { data } = await db().rpc("story_cards", { p_ids: ids });
  return (data ?? []) as StoryCardData[];
}

// ─── stories ────────────────────────────────────────────────────────────

const STORY_COLUMNS =
  "id, public_id, song_id, title, body_text, format, audio_duration_s, audio_peaks, transcript, author_display_name, place_time_note, source, playlist_id, published_at";

export async function getStoryPage(publicId: string) {
  "use cache";
  cached();
  const { data: row } = await db()
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("public_id", publicId)
    .eq("status", "published")
    .maybeSingle();
  if (!row) return null;

  const [song, tags, playlist, related, relatedSongs, reactionTypes] = await Promise.all([
    db().from("songs").select(SONG_COLUMNS).eq("id", row.song_id).single(),
    db().from("story_tags").select("tags(slug, label, sort_order)").eq("story_id", row.id),
    row.playlist_id
      ? db().from("playlists").select("slug, title").eq("id", row.playlist_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db().rpc("related_stories", { p_story: row.id, p_limit: 6 }),
    db().rpc("related_songs", { p_song: row.song_id, p_limit: 4 }),
    getReactionTypes(),
  ]);

  const story: StoryDetail = {
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    bodyText: row.body_text,
    format: row.format,
    durationS: row.audio_duration_s,
    peaks: row.audio_peaks,
    transcript: row.transcript,
    author: row.author_display_name,
    placeTimeNote: row.place_time_note,
    source: row.source,
    publishedAt: row.published_at,
    song: toSongDetail(song.data as SongRow),
    tags: ((tags.data ?? []) as unknown as { tags: { slug: string; label: string; sort_order: number } }[])
      .map((t) => t.tags)
      .filter(Boolean)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ slug, label }) => ({ slug, label })),
    playlist: playlist.data ?? null,
  };
  return {
    story,
    related: (related.data ?? []) as StoryCardData[],
    relatedSongs: ((relatedSongs.data ?? []) as SongSummary[]).filter((s) => s.id !== story.song.id),
    reactionTypes,
  };
}

export async function getReactionTypes() {
  "use cache";
  cached();
  const { data } = await db().from("reaction_types").select("key, emoji, label").order("sort_order");
  return (data ?? []) as { key: string; emoji: string; label: string }[];
}

// ─── playlists ──────────────────────────────────────────────────────────

export async function getPlaylists(): Promise<PlaylistSummary[]> {
  "use cache";
  cached();
  const { data } = await db()
    .from("playlists")
    .select("id, slug, title, session_date, location, description, cover_path, playlist_items(count)")
    .eq("published", true)
    .order("session_date", { ascending: false, nullsFirst: false });
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    sessionDate: p.session_date,
    location: p.location,
    description: p.description,
    coverUrl: coverUrl(p.cover_path),
    trackCount: (p.playlist_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function getPlaylistPage(slug: string) {
  "use cache";
  cached();
  const playlists = await getPlaylists();
  const playlist = playlists.find((p) => p.slug === slug);
  if (!playlist) return null;
  const { data: items } = await db()
    .from("playlist_items")
    .select("position, story_id, songs(id, slug, title, artist, artwork_url, release_year)")
    .eq("playlist_id", playlist.id)
    .order("position");
  const cards = await storyCards((items ?? []).map((i) => i.story_id).filter(Boolean) as string[]);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const tracks: PlaylistTrack[] = (items ?? []).map((i) => {
    const s = i.songs as unknown as {
      id: string;
      slug: string;
      title: string;
      artist: string;
      artwork_url: string | null;
      release_year: number | null;
    };
    return {
      position: i.position,
      song: { id: s.id, slug: s.slug, title: s.title, artist: s.artist, artworkUrl: s.artwork_url, releaseYear: s.release_year },
      story: i.story_id ? (byId.get(i.story_id) ?? null) : null,
    };
  });
  return { playlist, tracks };
}

// ─── misc ───────────────────────────────────────────────────────────────

export async function getActiveTags() {
  "use cache";
  cached();
  const { data } = await db().from("tags").select("id, slug, label").order("sort_order");
  return (data ?? []) as { id: string; slug: string; label: string }[];
}

export async function getSitemapEntries() {
  "use cache";
  cached();
  const [stories, songs, playlists] = await Promise.all([
    db().from("stories").select("public_id, published_at").eq("status", "published"),
    db().from("songs").select("slug, updated_at").gt("published_story_count", 0),
    getPlaylists(),
  ]);
  return {
    stories: stories.data ?? [],
    songs: songs.data ?? [],
    playlists,
  };
}

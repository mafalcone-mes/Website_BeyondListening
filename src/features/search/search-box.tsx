"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SearchCombobox, type SearchGroup, type SearchOption } from "@/components/patterns/search-combobox";
import { copy } from "@/content/copy";
import type { StoryCardData } from "@/features/catalog/types";

interface ArchiveResults {
  songs: { id: string; slug: string; title: string; artist: string; artworkUrl: string | null; storyCount: number }[];
  artists: { name: string; storyCount: number }[];
  stories: StoryCardData[];
}
export interface CatalogResult {
  provider: string;
  providerId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
}

const stories = (n: number) => `${n} ${n === 1 ? "story" : "stories"}`;
const submitHref = (r: CatalogResult) =>
  `/submit?provider=${encodeURIComponent(r.provider)}&pid=${encodeURIComponent(r.providerId)}`;

/**
 * Song search.
 * - mode "navigate" (top bar): finds songs, artists and stories in the archive. When a song
 *   has no stories yet, offers "be the first" results from the music catalog.
 * - mode "submit" (home hero): every result starts the submission flow with that song.
 */
export function SearchBox({
  mode,
  size = "md",
  onPick,
  placeholder,
}: {
  mode: "navigate" | "submit";
  size?: "md" | "lg";
  /** When set, picking a catalog result calls this instead of navigating (admin tools). */
  onPick?: (result: CatalogResult) => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const id = useId().replace(/:/g, "");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [archive, setArchive] = useState<ArchiveResults | null>(null);
  const [catalog, setCatalog] = useState<CatalogResult[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const request = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    const n = ++request.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const archiveRes: ArchiveResults =
          mode === "navigate"
            ? await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json())
            : { songs: [], artists: [], stories: [] };
        if (n !== request.current) return;
        setArchive(archiveRes);
        // Look up the external catalog when we're submitting, or when the archive has no matching song.
        if (mode === "submit" || archiveRes.songs.length === 0) {
          const cat = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
          if (n !== request.current) return;
          setCatalog(cat.results ?? []);
        } else {
          setCatalog(null);
        }
      } catch {
        if (n === request.current) setCatalog([]);
      } finally {
        if (n === request.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [value, mode]);

  const { groups, hrefs, picks } = useMemo(() => {
    const hrefs = new Map<string, string>();
    const picks = new Map<string, CatalogResult>();
    const groups: SearchGroup[] = [];
    const add = (group: SearchGroup, links: string[]) => {
      group.options.forEach((o, i) => hrefs.set(o.id, links[i]));
      groups.push(group);
    };
    if (archive && mode === "navigate") {
      add(
        {
          label: "Songs",
          options: archive.songs.map((s) => ({
            id: `${id}-song-${s.id}`,
            primary: s.title,
            secondary: s.artist,
            artworkUrl: s.artworkUrl,
            showArtwork: true,
            badge: stories(s.storyCount),
          })),
        },
        archive.songs.map((s) => `/songs/${s.slug}`),
      );
      add(
        {
          label: "Artists",
          options: archive.artists.map((a) => ({
            id: `${id}-artist-${a.name}`,
            primary: a.name,
            badge: stories(a.storyCount),
          })),
        },
        archive.artists.map((a) => `/archive?artist=${encodeURIComponent(a.name)}`),
      );
      add(
        {
          label: "Stories",
          options: archive.stories.map((s) => ({
            id: `${id}-story-${s.id}`,
            primary: s.title ?? `On “${s.song.title}”`,
            secondary: `${s.author} · ${s.song.title}`,
          })),
        },
        archive.stories.map((s) => `/stories/${s.publicId}`),
      );
    }
    if (catalog) {
      add(
        {
          label: mode === "submit" ? "Pick your song" : "Not in the archive yet",
          hint: mode === "navigate" && catalog.length ? copy.search.beTheFirst : undefined,
          options: catalog.map((r) => ({
            id: `${id}-cat-${r.provider}-${r.providerId}`,
            primary: r.title,
            secondary: [r.artist, r.album].filter(Boolean).join(" · "),
            artworkUrl: r.artworkUrl,
            showArtwork: true,
          })),
        },
        catalog.map(submitHref),
      );
      catalog.forEach((r) => picks.set(`${id}-cat-${r.provider}-${r.providerId}`, r));
    }
    return { groups, hrefs, picks };
  }, [archive, catalog, mode, id]);

  const longEnough = value.trim().length >= 2;
  const options: SearchOption[] = longEnough ? groups.flatMap((g) => g.options) : [];
  const open = focused && longEnough && (loading || archive !== null || catalog !== null);
  const emptyMessage = loading ? null : copy.search.noResults;

  const go = (option: SearchOption) => {
    const picked = picks.get(option.id);
    if (onPick && picked) {
      onPick(picked);
      setFocused(false);
      setValue("");
      return;
    }
    const href = hrefs.get(option.id);
    if (!href) return;
    setFocused(false);
    router.push(href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!options.length) return;
      const i = options.findIndex((o) => o.id === active);
      const next = e.key === "ArrowDown" ? (i + 1) % options.length : (i - 1 + options.length) % options.length;
      setActive(options[next].id);
    } else if (e.key === "Enter") {
      const option = options.find((o) => o.id === active) ?? options[0];
      if (option) {
        e.preventDefault();
        go(option);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <SearchCombobox
      id={id}
      label={mode === "submit" ? copy.hero.question : copy.search.label}
      placeholder={placeholder ?? (mode === "submit" ? copy.hero.searchPlaceholder : copy.search.placeholder)}
      value={value}
      open={open}
      loading={loading}
      groups={groups}
      activeId={active}
      emptyMessage={emptyMessage}
      size={size}
      onChange={(v) => {
        setValue(v);
        setActive(null);
        setFocused(true);
      }}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onSelect={go}
      onHover={setActive}
    />
  );
}

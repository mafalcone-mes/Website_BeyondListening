import "server-only";
import { normalizeText } from "./normalize";
import type { CatalogResult, CatalogTrack } from "./types";

/*
 * Offline catalog (MUSIC_PROVIDER=mock): no external requests at all.
 * No previews (they would require a request to Deezer/Apple).
 */

const CATALOG: [string, string, string, number, string][] = [
  ["Queen", "Bohemian Rhapsody", "A Night at the Opera", 1975, "Rock"],
  ["Fleetwood Mac", "Dreams", "Rumours", 1977, "Rock"],
  ["Tracy Chapman", "Fast Car", "Tracy Chapman", 1988, "Folk"],
  ["Lucio Dalla", "Caruso", "DallAmeriCaruso", 1986, "Pop"],
  ["Jeff Buckley", "Hallelujah", "Grace", 1994, "Rock"],
  ["Oasis", "Wonderwall", "(What's the Story) Morning Glory?", 1995, "Alternative"],
  ["Adele", "Someone Like You", "21", 2011, "Pop"],
  ["The Beatles", "Here Comes The Sun", "Abbey Road", 1969, "Rock"],
  ["Bob Marley & The Wailers", "Redemption Song", "Uprising", 1980, "Reggae"],
  ["Toto", "Africa", "Toto IV", 1982, "Pop"],
  ["a-ha", "Take On Me", "Hunting High and Low", 1985, "Pop"],
  ["Whitney Houston", "I Wanna Dance with Somebody (Who Loves Me)", "Whitney", 1987, "Pop"],
  ["TLC", "Waterfalls", "CrazySexyCool", 1994, "R&B / Soul"],
  ["Radiohead", "No Surprises", "OK Computer", 1997, "Alternative"],
  ["Coldplay", "The Scientist", "A Rush of Blood to the Head", 2002, "Rock"],
  ["Amy Winehouse", "Back To Black", "Back to Black", 2006, "R&B / Soul"],
  ["Bon Iver", "Skinny Love", "For Emma, Forever Ago", 2007, "Alternative"],
  ["Lorde", "Royals", "Pure Heroine", 2013, "Alternative"],
  ["Frank Ocean", "Pink + White", "Blonde", 2016, "Pop"],
  ["Olivia Rodrigo", "drivers license", "SOUR", 2021, "Pop"],
  ["Otis Redding", "(Sittin' On) The Dock of the Bay", "The Dock of the Bay", 1968, "R&B / Soul"],
  ["Nina Simone", "Feeling Good", "I Put a Spell on You", 1965, "Jazz"],
  ["David Bowie", "Heroes", "\"Heroes\"", 1977, "Rock"],
  ["Mina", "Se telefonando", "Studio Uno 66", 1966, "Pop"],
  ["Franco Battiato", "La cura", "L'imboscata", 1996, "Pop"],
  ["Joni Mitchell", "A Case of You", "Blue", 1971, "Folk"],
  ["Prince", "Purple Rain", "Purple Rain", 1984, "Pop"],
  ["Kate Bush", "Running Up That Hill", "Hounds of Love", 1985, "Pop"],
  ["Nirvana", "Smells Like Teen Spirit", "Nevermind", 1991, "Rock"],
  ["Daft Punk", "Get Lucky", "Random Access Memories", 2013, "Electronic"],
];

const tracks: CatalogTrack[] = CATALOG.map(([artist, title, album, year, genre], i) => ({
  provider: "mock",
  providerId: `mock-${i + 1}`,
  title,
  artist,
  album,
  artworkUrl: null,
  releaseYear: year,
  hasPreview: false,
  isrc: null,
  genre,
  deezerId: null,
  itunesId: null,
}));

export function mockSearch(q: string, limit = 10): CatalogResult[] {
  const words = normalizeText(q).split(" ").filter(Boolean);
  return tracks
    .filter((t) => {
      const hay = normalizeText(`${t.artist} ${t.title} ${t.album}`);
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

export function mockTrack(id: string): CatalogTrack | null {
  return tracks.find((t) => t.providerId === id) ?? null;
}

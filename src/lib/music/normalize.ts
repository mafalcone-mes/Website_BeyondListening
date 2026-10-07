/**
 * Song normalization used for de-duplication. Two releases of the same
 * recording ("Dreams" and "Dreams - 2004 Remaster") share the same norm key.
 */

const VERSION_WORDS =
  /\b(remaster(ed)?|\d{4} remaster|mono|stereo|radio edit|single version|album version|deluxe|edit)\b/i;

export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Strips "(feat. X)", "[Remastered 2011]", " - Radio Edit" and similar suffixes. */
export function cleanTitle(title: string): string {
  let t = title;
  t = t.replace(/\s*[([][^)\]]*\b(feat|ft|with)\b\.?[^)\]]*[)\]]/gi, "");
  t = t.replace(/\s*[([][^)\]]*[)\]]/g, (m) => (VERSION_WORDS.test(m) ? "" : m));
  t = t.replace(/\s+-\s+.*$/g, (m) => (VERSION_WORDS.test(m) ? "" : m));
  t = t.replace(/\s+(feat|ft)\.?\s.*$/i, "");
  return t.trim();
}

export function cleanArtist(artist: string): string {
  return artist.replace(/\s+(feat|ft)\.?\s.*$/i, "").trim();
}

export function songNormKey(artist: string, title: string): string {
  return `${normalizeText(cleanArtist(artist))}::${normalizeText(cleanTitle(title))}`;
}

export function slugify(input: string, max = 60): string {
  return normalizeText(input).replace(/\s/g, "-").slice(0, max).replace(/-+$/g, "");
}

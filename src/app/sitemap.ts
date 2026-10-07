import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/features/catalog/queries";
import { serverEnv } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = serverEnv().SITE_URL;
  const { stories, songs, playlists } = await getSitemapEntries();
  return [
    ...["", "/archive", "/playlists", "/about", "/privacy", "/terms", "/license"].map((p) => ({ url: `${base}${p}` })),
    ...stories.map((s) => ({ url: `${base}/stories/${s.public_id}`, lastModified: s.published_at })),
    ...songs.map((s) => ({ url: `${base}/songs/${s.slug}`, lastModified: s.updated_at })),
    ...playlists.map((p) => ({ url: `${base}/playlists/${p.slug}` })),
  ];
}

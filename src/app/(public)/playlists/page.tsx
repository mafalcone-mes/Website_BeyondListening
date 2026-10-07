import type { Metadata } from "next";
import { EmptyState } from "@/components/patterns/empty-state";
import { PlaylistCard } from "@/components/sections/playlist";
import { copy } from "@/content/copy";
import { getPlaylists } from "@/features/catalog/queries";

export const metadata: Metadata = { title: copy.playlists.title, description: copy.playlists.intro };

export default async function PlaylistsPage() {
  const playlists = await getPlaylists();
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12">
      <header className="mb-10 max-w-reading">
        <h1 className="text-4xl">{copy.playlists.title}</h1>
        <p className="mt-3 font-body text-lg text-fg-muted">{copy.playlists.intro}</p>
      </header>
      {playlists.length ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p) => (
            <li key={p.id}>
              <PlaylistCard {...p} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={copy.playlists.empty} />
      )}
    </div>
  );
}

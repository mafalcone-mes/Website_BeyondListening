"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { Dialog } from "@/components/patterns/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { mergeSongs, refreshSongLinks, updateSong } from "./misc-actions";

export interface AdminSong {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  releaseYear: number | null;
  genre: string | null;
  artworkUrl: string | null;
  storyCount: number;
  enrichment: string;
}

export function SongList({ songs }: { songs: AdminSong[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminSong | null>(null);
  const [merging, setMerging] = useState<AdminSong | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [form, setForm] = useState({ title: "", artist: "", album: "", releaseYear: "", genre: "", artworkUrl: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMessage(r.message ?? null);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const open = (s: AdminSong) => {
    setEditing(s);
    setForm({
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      releaseYear: s.releaseYear ? String(s.releaseYear) : "",
      genre: s.genre ?? "",
      artworkUrl: s.artworkUrl ?? "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {message ? (
        <p role="status" className="rounded-md bg-accent-soft p-3 text-sm">
          {message}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {songs.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
            <Artwork url={s.artworkUrl} alt="" className="size-12 rounded-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.title}</p>
              <p className="truncate text-sm text-fg-muted">
                {[s.artist, s.releaseYear, s.genre].filter(Boolean).join(" · ")} · {s.storyCount} stories
                {s.enrichment !== "done" ? ` · details ${s.enrichment}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => open(s)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setMerging(s); setMergeTarget(""); }}>
              Merge…
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} title="Edit song" description="Fix a wrong year, genre or spelling.">
        {editing ? (
          <div className="flex flex-col gap-3">
            <Field id="so-title" label="Title">
              <TextInput id="so-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field id="so-artist" label="Artist">
              <TextInput id="so-artist" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
            </Field>
            <Field id="so-album" label="Album" optional>
              <TextInput id="so-album" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="so-year" label="Original year" optional>
                <TextInput id="so-year" inputMode="numeric" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} />
              </Field>
              <Field id="so-genre" label="Genre" optional>
                <TextInput id="so-genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
              </Field>
            </div>
            <Field id="so-art" label="Artwork image address" optional>
              <TextInput id="so-art" value={form.artworkUrl} onChange={(e) => setForm({ ...form, artworkUrl: e.target.value })} />
            </Field>
            <Button
              loading={pending}
              onClick={() =>
                run(
                  () =>
                    updateSong({
                      id: editing.id,
                      ...form,
                      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
                    }),
                  () => setEditing(null),
                )
              }
            >
              Save
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => refreshSongLinks(editing.id), () => setEditing(null))}>
              Refresh details and “Listen on…” links
            </Button>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(merging)}
        onOpenChange={(o) => !o && setMerging(null)}
        title="Merge a duplicate"
        description={merging ? `Move all stories from “${merging.title}” (${merging.artist}) to another song, then remove this one.` : undefined}
      >
        {merging ? (
          <div className="flex flex-col gap-3">
            <label htmlFor="merge-target" className="text-sm font-semibold">
              Keep this song instead
            </label>
            <select id="merge-target" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="min-h-11 rounded-md border border-border-strong bg-surface-raised px-3">
              <option value="">Choose…</option>
              {songs
                .filter((s) => s.id !== merging.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.artist} {s.releaseYear ? `(${s.releaseYear})` : ""}
                  </option>
                ))}
            </select>
            <Button variant="danger" disabled={!mergeTarget} loading={pending} onClick={() => run(() => mergeSongs(merging.id, mergeTarget), () => setMerging(null))}>
              Merge
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

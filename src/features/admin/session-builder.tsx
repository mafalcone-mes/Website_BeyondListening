"use client";
import { ArrowDown, ArrowUp, Link2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { Dialog } from "@/components/patterns/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { cx } from "@/components/ui/utils";
import { SearchBox } from "@/features/search/search-box";
import type { PickedSong } from "@/features/submission/actions";
import {
  addTrack,
  adminPickSong,
  deletePlaylist,
  findStories,
  publishPlaylist,
  removeTrack,
  reorderTracks,
  setTrackStory,
  unpublishPlaylist,
  updatePlaylist,
  uploadCover,
} from "./session-actions";
import { SessionStoryForm } from "./session-story-form";

export interface SessionData {
  id: string;
  slug: string;
  title: string;
  sessionDate: string | null;
  location: string | null;
  description: string | null;
  coverUrl: string | null;
  published: boolean;
  items: {
    id: string;
    song: { id: string; title: string; artist: string; artworkUrl: string | null };
    story: { id: string; title: string | null; author: string; status: string } | null;
  }[];
}

type StoryOption = Awaited<ReturnType<typeof findStories>>[number];

/** Resizes an image in the browser to a WebP (max 1200 px) before uploading. */
async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/webp", 0.82));
}

const statusLabel: Record<string, string> = { published: "Published", pending_review: "Waiting for review" };

export function SessionBuilder({ session }: { session: SessionData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState({
    title: session.title,
    sessionDate: session.sessionDate ?? "",
    location: session.location ?? "",
    description: session.description ?? "",
  });
  const [song, setSong] = useState<PickedSong | null>(null);
  const [addMode, setAddMode] = useState<"choose" | "link" | "new">("choose");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<StoryOption[] | null>(null);
  const [linkFor, setLinkFor] = useState<SessionData["items"][number] | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMessage(r.message ?? null);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const resetAdd = () => {
    setSong(null);
    setAddMode("choose");
    setOptions(null);
    setQuery("");
  };

  const loadOptions = (songId: string, q: string) => start(async () => setOptions(await findStories(songId, q)));

  const move = (index: number, delta: number) => {
    const ids = session.items.map((i) => i.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    run(() => reorderTracks(session.id, ids));
  };

  const missing = session.items.filter((i) => !i.story).length;

  return (
    <div className="flex flex-col gap-10">
      {message ? (
        <p role="status" className="rounded-md bg-accent-soft p-3 text-sm">
          {message}
        </p>
      ) : null}

      {/* Tracks */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Tracks</h2>
        {session.items.length ? (
          <ol className="flex flex-col gap-3">
            {session.items.map((item, i) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-6 text-right font-mono text-sm text-fg-subtle">{i + 1}</span>
                  <Artwork url={item.song.artworkUrl} alt="" className="size-12 rounded-sm" />
                  <div className="min-w-40 flex-1">
                    <p className="truncate font-semibold">{item.song.title}</p>
                    <p className="truncate text-sm text-fg-muted">{item.song.artist}</p>
                  </div>
                  <div className="ml-auto flex">
                    <button type="button" aria-label="Move up" disabled={i === 0 || pending} onClick={() => move(i, -1)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === session.items.length - 1 || pending} onClick={() => move(i, 1)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button type="button" aria-label="Remove track" disabled={pending} onClick={() => run(() => removeTrack(item.id))} className="inline-flex size-11 items-center justify-center rounded-full text-danger hover:bg-surface">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
                {item.story ? (
                  <p className="text-sm text-fg-muted">
                    {item.story.title ?? "Story"} · {item.story.author} ·{" "}
                    <span className={item.story.status === "published" ? "text-success" : "text-warning"}>{statusLabel[item.story.status] ?? item.story.status}</span>
                  </p>
                ) : (
                  <Button variant="secondary" size="sm" className="self-start" onClick={() => { setLinkFor(item); setOptions(null); setQuery(""); loadOptions(item.song.id, ""); }}>
                    <Link2 className="size-4" aria-hidden /> Link a story
                  </Button>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-fg-muted">No tracks yet. Add the first song below.</p>
        )}
      </section>

      {/* Add a track */}
      <section className="flex flex-col gap-4 rounded-xl border border-dashed border-border-strong p-5">
        <h2 className="inline-flex items-center gap-2 text-2xl">
          <Plus className="size-5" aria-hidden /> Add a song
        </h2>
        {!song ? (
          <SearchBox mode="submit" placeholder="Search the song…" onPick={(r) => start(async () => setSong(await adminPickSong(r.provider as "deezer", r.providerId)))} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Artwork url={song.artworkUrl} alt="" className="size-14 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{song.title}</p>
                <p className="truncate text-sm text-fg-muted">{song.artist}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetAdd}>
                Change
              </Button>
            </div>
            {addMode === "choose" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button onClick={() => setAddMode("new")}>Record or write a new story</Button>
                <Button variant="secondary" onClick={() => { setAddMode("link"); loadOptions(song.id, ""); }}>
                  Link an existing story
                </Button>
                <Button variant="ghost" onClick={() => run(() => addTrack({ playlistId: session.id, songId: song.id }), resetAdd)}>
                  Song only, for now
                </Button>
              </div>
            ) : addMode === "new" ? (
              <SessionStoryForm playlistId={session.id} songId={song.id} onSaved={() => { setMessage("Story saved and added to the session."); resetAdd(); router.refresh(); }} />
            ) : (
              <StoryPicker
                options={options}
                query={query}
                onQuery={(q) => { setQuery(q); loadOptions(song.id, q); }}
                onPick={(storyId) => run(() => addTrack({ playlistId: session.id, songId: song.id, storyId }), resetAdd)}
                busy={pending}
              />
            )}
          </div>
        )}
      </section>

      {/* Details */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Session details</h2>
        <Field id="pl-title" label="Title">
          <TextInput id="pl-title" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="pl-date" label="Date" optional>
            <TextInput id="pl-date" type="date" value={details.sessionDate} onChange={(e) => setDetails({ ...details, sessionDate: e.target.value })} />
          </Field>
          <Field id="pl-loc" label="Place" optional>
            <TextInput id="pl-loc" value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} />
          </Field>
        </div>
        <Field id="pl-desc" label="Description" optional>
          <TextArea id="pl-desc" rows={4} maxLength={2000} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
        </Field>
        <Button variant="secondary" className="self-start" loading={pending} onClick={() => run(() => updatePlaylist(session.id, details))}>
          Save details
        </Button>
        <Field id="pl-cover" label="Cover image" optional hint="A photo of the evening, the record player… Resized automatically.">
          <div className="flex items-center gap-4">
            {session.coverUrl ? <Artwork url={session.coverUrl} alt="Current cover" className="size-20 rounded-md" /> : null}
            <input
              id="pl-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                run(async () => {
                  const form = new FormData();
                  form.set("cover", new File([await toWebp(file)], "cover.webp", { type: "image/webp" }));
                  return uploadCover(session.id, form);
                });
              }}
            />
          </div>
        </Field>
      </section>

      {/* Publish */}
      <section className="flex flex-col gap-3 border-t border-border pt-8">
        {session.published ? (
          <>
            <p className="text-success">This session is published.</p>
            <div className="flex flex-wrap gap-3">
              <a href={`/playlists/${session.slug}`} target="_blank" className="text-accent underline">
                View it on the site
              </a>
              <Button variant="secondary" loading={pending} onClick={() => run(() => unpublishPlaylist(session.id))}>
                Hide from the site
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={cx("text-sm", missing ? "text-warning" : "text-fg-muted")}>
              {missing ? `${missing} track${missing === 1 ? "" : "s"} still need${missing === 1 ? "s" : ""} a story before publishing.` : "Ready to publish when you are."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" loading={pending} disabled={!session.items.length} onClick={() => run(() => publishPlaylist(session.id))}>
                Publish the session
              </Button>
              <Button variant="ghost" onClick={() => run(() => deletePlaylist(session.id), () => router.push("/admin/sessions"))}>
                Delete this draft
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog open={Boolean(linkFor)} onOpenChange={(o) => !o && setLinkFor(null)} title={`A story for “${linkFor?.song.title ?? ""}”`}>
        {linkFor ? (
          <StoryPicker
            options={options}
            query={query}
            onQuery={(q) => { setQuery(q); loadOptions(linkFor.song.id, q); }}
            onPick={(storyId) => run(() => setTrackStory(linkFor.id, storyId), () => setLinkFor(null))}
            busy={pending}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function StoryPicker({
  options,
  query,
  onQuery,
  onPick,
  busy,
}: {
  options: StoryOption[] | null;
  query: string;
  onQuery: (q: string) => void;
  onPick: (storyId: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field id="story-q" label="Search all stories" hint="Leave empty to see stories about this song.">
        <TextInput id="story-q" value={query} onChange={(e) => onQuery(e.target.value)} hasHint />
      </Field>
      {options === null ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : options.length ? (
        <ul className="flex flex-col gap-2">
          {options.map((o) => (
            <li key={o.id}>
              <button type="button" disabled={busy} onClick={() => onPick(o.id)} className="flex w-full flex-col gap-1 rounded-lg border border-border p-3 text-left hover:bg-surface">
                <span className="font-semibold">
                  {o.title ?? "Untitled"} <span className="font-normal text-fg-muted">· {o.author}</span>
                </span>
                <span className="text-xs text-fg-subtle">
                  {o.song.title} · {statusLabel[o.status] ?? o.status}
                </span>
                <span className="line-clamp-2 text-sm text-fg-muted">{o.excerpt}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">No stories found.</p>
      )}
    </div>
  );
}

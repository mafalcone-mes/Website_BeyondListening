"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { Waveform } from "@/components/patterns/waveform";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextArea, TextInput } from "@/components/ui/field";
import { cx, formatDate } from "@/components/ui/utils";
import { LIMITS } from "@/config/limits";
import { SearchBox } from "@/features/search/search-box";
import type { PickedSong } from "@/features/submission/actions";
import type { ReviewStory } from "./review-card";
import { adminPickSong } from "./session-actions";
import { adminAudioUrl, approveStory, deleteStory, unpublishStory, updateStory } from "./story-actions";

export interface EditorData {
  story: ReviewStory;
  publicId: string;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  rejectionReason: string | null;
  consent: { method: string; version: string; at: string; voice: boolean };
  hasEmail: boolean;
  history: { action: string; created_at: string }[];
}

const STATUS: Record<string, string> = {
  published: "Published",
  pending_review: "Waiting for review",
  unpublished: "Hidden",
  pending_verification: "Waiting for email confirmation",
  rejected: "Not published",
};

export function StoryEditor({ data, tags }: { data: EditorData; tags: { id: string; label: string }[] }) {
  const router = useRouter();
  const s = data.story;
  const [form, setForm] = useState({
    title: s.title ?? "",
    bodyText: s.bodyText ?? "",
    transcript: s.transcript ?? "",
    pseudonym: s.author,
    placeNote: s.placeNote ?? "",
    tagIds: s.tagIds,
    featured: data.featured,
  });
  const [song, setSong] = useState<PickedSong | { id: string; title: string; artist: string; artworkUrl: string | null }>(s.song);
  const [changingSong, setChangingSong] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const save = () =>
    run(() =>
      updateStory({
        storyId: s.id,
        songId: song.id !== s.song.id ? song.id : undefined,
        ...form,
      }),
    );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-surface px-3 py-1 text-sm">{STATUS[data.status] ?? data.status}</span>
        {data.status === "published" ? (
          <a href={`/stories/${data.publicId}`} target="_blank" className="text-sm text-accent underline">
            View on the site
          </a>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="rounded-md bg-accent-soft p-3 text-sm">
          {message}
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-3">
          <Artwork url={song.artworkUrl} alt="" className="size-14 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{song.title}</p>
            <p className="truncate text-sm text-fg-muted">{song.artist}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setChangingSong(!changingSong)}>
            {changingSong ? "Keep this song" : "Change song"}
          </Button>
        </div>
        {changingSong ? (
          <SearchBox
            mode="submit"
            placeholder="Search the right song…"
            onPick={(r) =>
              start(async () => {
                const picked = await adminPickSong(r.provider as "deezer", r.providerId);
                if (picked) setSong(picked);
                setChangingSong(false);
              })
            }
          />
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="ed-name" label="Name or pseudonym">
          <TextInput id="ed-name" value={form.pseudonym} maxLength={LIMITS.pseudonym} onChange={(e) => setForm({ ...form, pseudonym: e.target.value })} />
        </Field>
        <Field id="ed-place" label="Where and when" optional>
          <TextInput id="ed-place" value={form.placeNote} maxLength={LIMITS.placeNote} onChange={(e) => setForm({ ...form, placeNote: e.target.value })} />
        </Field>
      </div>
      <Field id="ed-title" label="Title" optional>
        <TextInput id="ed-title" value={form.title} maxLength={LIMITS.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      {s.format !== "audio" ? (
        <Field id="ed-body" label={s.format === "text" ? "Story" : "Written introduction"}>
          <TextArea id="ed-body" rows={10} maxLength={LIMITS.storyText} value={form.bodyText} onChange={(e) => setForm({ ...form, bodyText: e.target.value })} />
        </Field>
      ) : null}
      {s.format !== "text" ? (
        <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
          {s.peaks ? <Waveform peaks={s.peaks} /> : null}
          {audioUrl ? (
            <audio controls src={audioUrl} className="w-full" />
          ) : (
            <Button variant="secondary" size="sm" className="self-start" onClick={() => start(async () => setAudioUrl(await adminAudioUrl(s.id)))}>
              Listen to the recording
            </Button>
          )}
          <Field id="ed-tr" label="Transcript">
            <TextArea id="ed-tr" rows={8} maxLength={LIMITS.transcript} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} />
          </Field>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Themes</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = form.tagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setForm({ ...form, tagIds: on ? form.tagIds.filter((x) => x !== t.id) : [...form.tagIds, t.id] })}
                className={cx("min-h-10 rounded-full border px-3 text-sm", on ? "border-accent bg-accent text-accent-fg" : "border-border-strong")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Checkbox id="ed-featured" checked={form.featured} onChange={(featured) => setForm({ ...form, featured })}>
        Feature this story on the home page ★
      </Checkbox>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={save} loading={pending}>
          Save changes
        </Button>
        {data.status === "published" ? (
          <Button variant="secondary" onClick={() => run(() => unpublishStory(s.id))} disabled={pending}>
            Hide from the site
          </Button>
        ) : data.status !== "pending_verification" ? (
          <Button variant="secondary" onClick={() => run(() => approveStory({ storyId: s.id, transcript: s.format !== "text" ? form.transcript : undefined }))} disabled={pending}>
            Publish
          </Button>
        ) : null}
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-border p-4 text-sm text-fg-muted">
        <h2 className="text-lg text-fg">Record</h2>
        <p>
          Consent: {data.consent.method === "admin_recorded" ? "recorded by the admin at a live session" : "given on the website"} on{" "}
          {formatDate(data.consent.at)} (texts version {data.consent.version}){data.consent.voice ? ", including voice" : ""}.
        </p>
        <p>Contact email: {data.hasEmail ? "on file (never shown)" : "none"}.</p>
        {data.rejectionReason ? <p>Note sent when not published: “{data.rejectionReason}”</p> : null}
        <ul className="mt-2 flex flex-col gap-1">
          {data.history.map((h, i) => (
            <li key={i}>
              {formatDate(h.created_at)} · {h.action.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg">Delete permanently</h2>
        <p className="text-sm text-fg-muted">Removes the story, its recording and the contact email. This can&apos;t be undone.</p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <Button variant="danger" loading={pending} onClick={() => run(() => deleteStory(s.id), () => router.push("/admin/stories"))}>
              Yes, delete forever
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="self-start text-danger" onClick={() => setConfirmDelete(true)}>
            Delete this story…
          </Button>
        )}
      </section>
    </div>
  );
}

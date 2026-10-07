"use client";
import { Check, Mic, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { Dialog } from "@/components/patterns/dialog";
import { Waveform } from "@/components/patterns/waveform";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { cx, formatDate, formatTime } from "@/components/ui/utils";
import { LIMITS } from "@/config/limits";
import { PlayButton } from "@/features/player/play-button";
import { previewTrack } from "@/features/player/tracks";
import { useTranscriber } from "@/features/submission/use-transcriber";
import { adminAudioUrl, approveStory, rejectStory } from "./story-actions";

export interface ReviewStory {
  id: string;
  title: string | null;
  bodyText: string | null;
  transcript: string | null;
  transcriptReviewed: boolean;
  format: "text" | "audio" | "text_audio";
  durationS: number | null;
  peaks: number[] | null;
  author: string;
  placeNote: string | null;
  source: "public" | "live_session";
  createdAt: string;
  consentPromotion: boolean;
  tagIds: string[];
  song: { id: string; slug: string; title: string; artist: string; artworkUrl: string | null; releaseYear: number | null };
}

const QUICK_REASONS = [
  "It isn't about a song or a personal memory.",
  "It includes private details about other people.",
  "It contains hateful or offensive content.",
  "It looks like spam or advertising.",
];

export function ReviewCard({ story, tags, onDone }: { story: ReviewStory; tags: { id: string; label: string }[]; onDone: (id: string) => void }) {
  const [title, setTitle] = useState(story.title ?? "");
  const [transcript, setTranscript] = useState(story.transcript ?? "");
  const [tagIds, setTagIds] = useState(story.tagIds);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const transcriber = useTranscriber({ onDone: (text) => setTranscript((t) => t || text) });
  const isVoice = story.format !== "text";

  const loadAudio = () =>
    start(async () => {
      const url = await adminAudioUrl(story.id);
      if (url) setAudioUrl(url);
      else setMessage("The recording couldn't be loaded.");
    });

  const generate = () =>
    start(async () => {
      const url = audioUrl ?? (await adminAudioUrl(story.id));
      if (!url) return setMessage("The recording couldn't be loaded.");
      setAudioUrl(url);
      const blob = await fetch(url).then((r) => r.blob());
      const state = transcriber.state;
      const device = state.status === "available" ? state.device : "wasm";
      void transcriber.transcribe(blob, device);
    });

  const approve = () =>
    start(async () => {
      const r = await approveStory({ storyId: story.id, title, transcript: isVoice ? transcript : undefined, tagIds });
      setMessage(r.message ?? null);
      if (r.ok) onDone(story.id);
    });

  const reject = (notify: boolean) =>
    start(async () => {
      const r = await rejectStory({ storyId: story.id, reason, notify });
      setRejectOpen(false);
      setMessage(r.message ?? null);
      if (r.ok) onDone(story.id);
    });

  const t = transcriber.state;
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-surface-raised p-5 shadow-1">
      <header className="flex items-center gap-4">
        <Artwork url={story.song.artworkUrl} alt="" className="size-16 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl">{story.song.title}</p>
          <p className="truncate text-sm text-fg-muted">{[story.song.artist, story.song.releaseYear].filter(Boolean).join(" · ")}</p>
        </div>
        <PlayButton tracks={[previewTrack(story.song)]} label={`a preview of ${story.song.title}`} size="sm" variant="outline" />
      </header>

      <p className="text-sm text-fg-muted">
        <strong className="text-fg">{story.author}</strong>
        {story.placeNote ? ` · ${story.placeNote}` : ""} · sent {formatDate(story.createdAt)}
        {story.source === "live_session" ? " · live session" : ""}
        {story.consentPromotion ? " · OK to feature in promotion" : ""}
      </p>

      <Field id={`title-${story.id}`} label="Title" optional>
        <TextInput id={`title-${story.id}`} value={title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      {story.bodyText ? (
        <div className="rounded-md bg-surface p-4 font-body text-lg leading-relaxed whitespace-pre-line">{story.bodyText}</div>
      ) : null}

      {isVoice ? (
        <div className="flex flex-col gap-3 rounded-md bg-surface p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <Mic className="size-4" aria-hidden /> Recording · {formatTime(story.durationS)}
          </p>
          {story.peaks ? <Waveform peaks={story.peaks} /> : null}
          {audioUrl ? (
            <audio controls src={audioUrl} className="w-full" />
          ) : (
            <Button variant="secondary" size="sm" className="self-start" onClick={loadAudio} loading={pending && !audioUrl}>
              Listen to the recording
            </Button>
          )}
          <Field
            id={`tr-${story.id}`}
            label="Transcript"
            hint={story.transcriptReviewed ? "Checked by the author." : story.transcript ? "Not checked by the author." : "Missing: add it before publishing."}
          >
            <TextArea id={`tr-${story.id}`} rows={6} maxLength={LIMITS.transcript} value={transcript} onChange={(e) => setTranscript(e.target.value)} hasHint />
          </Field>
          {!transcript ? (
            t.status === "downloading" || t.status === "transcribing" ? (
              <p role="status" className="text-sm text-fg-muted">
                {t.status === "downloading" ? `Downloading the speech model… ${Math.round(t.progress * 100)}%` : `Transcribing… ${t.text}`}
              </p>
            ) : (
              <Button variant="secondary" size="sm" className="self-start" onClick={generate} disabled={t.status === "checking"}>
                <Sparkles className="size-4" aria-hidden /> Generate transcript on this device
              </Button>
            )
          ) : null}
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Themes</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const on = tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={on}
                onClick={() => setTagIds(on ? tagIds.filter((x) => x !== tag.id) : [...tagIds, tag.id])}
                className={cx(
                  "min-h-10 rounded-full border px-3 text-sm",
                  on ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-raised",
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {message ? (
        <p role="status" className="text-sm text-fg-muted">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={() => setRejectOpen(true)} disabled={pending}>
          <X className="size-5" aria-hidden /> Not this one
        </Button>
        <Button size="lg" onClick={approve} loading={pending} disabled={isVoice && !transcript.trim()}>
          <Check className="size-5" aria-hidden /> Approve
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen} title="Don't publish this story" description="The author receives a kind email. A note is optional.">
        <div className="flex flex-col gap-3">
          {QUICK_REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className={cx("rounded-md border p-3 text-left text-sm", reason === r ? "border-accent bg-accent-soft" : "border-border")}>
              {r}
            </button>
          ))}
          <Field id={`reason-${story.id}`} label="Note to the author" optional>
            <TextArea id={`reason-${story.id}`} rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Button variant="danger" onClick={() => reject(true)} loading={pending}>
            Don&apos;t publish, and tell the author
          </Button>
          <Button variant="ghost" onClick={() => reject(false)} disabled={pending}>
            Don&apos;t publish, without emailing (spam)
          </Button>
        </div>
      </Dialog>
    </article>
  );
}

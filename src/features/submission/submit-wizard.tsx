"use client";
import { del, get, set } from "idb-keyval";
import { ArrowLeft, ArrowRight, FileAudio, Mic, PenLine, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Artwork } from "@/components/patterns/artwork";
import { RecorderPanel } from "@/components/patterns/recorder-panel";
import { Stepper } from "@/components/patterns/stepper";
import { Waveform } from "@/components/patterns/waveform";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextArea, TextInput } from "@/components/ui/field";
import { cx, formatTime } from "@/components/ui/utils";
import { LIMITS } from "@/config/limits";
import { consentTexts } from "@/content/legal";
import { AltchaField } from "@/features/captcha/altcha-field";
import { SearchBox } from "@/features/search/search-box";
import { finalizeAudio, pickSong, submitStory, type PickedSong } from "./actions";
import type { SubmissionInput } from "./schema";
import { ACCEPTED_UPLOAD_TYPES, analyse, estimateMinutes, MAX_SECONDS } from "./audio";
import { uploadWithProgress } from "./upload";
import { useRecorder } from "./use-recorder";
import { useTranscriber } from "./use-transcriber";

type Mode = "write" | "record" | "upload";
interface AudioDraft {
  blob: Blob;
  mime: string;
  durationS: number;
  peaks: number[];
}
interface TextDraft {
  mode: Mode;
  bodyText: string;
  addText: boolean;
  transcript: string;
  transcriptReviewed: boolean;
  transcriptSkipped: boolean;
  pseudonym: string;
  email: string;
  title: string;
  placeNote: string;
  tagIds: string[];
}

const DRAFT_KEY = "bl:submit-draft";
const AUDIO_KEY = "bl:submit-audio";
const emptyDraft: TextDraft = {
  mode: "write",
  bodyText: "",
  addText: false,
  transcript: "",
  transcriptReviewed: false,
  transcriptSkipped: false,
  pseudonym: "",
  email: "",
  title: "",
  placeNote: "",
  tagIds: [],
};

function loadDraft(): TextDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyDraft, ...JSON.parse(raw) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

export function SubmitWizard({
  initialSong,
  pick,
  tags,
}: {
  initialSong: PickedSong | null;
  pick: { provider: "deezer" | "itunes" | "mock"; providerId: string } | null;
  tags: { id: string; slug: string; label: string }[];
}) {
  const router = useRouter();
  const [song, setSong] = useState<PickedSong | null>(initialSong);
  const [picking, setPicking] = useState(Boolean(pick && !initialSong));
  const [changingSong, setChangingSong] = useState(false);
  const [draft, setDraft] = useState<TextDraft>(loadDraft);
  const [audio, setAudio] = useState<AudioDraft | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [step, setStep] = useState(initialSong ? 1 : 0);
  const [consents, setConsents] = useState({ publication: false, license: false, privacy: false, age: false, others: false, voice: false, promotion: false });
  const [human, setHuman] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<{ name: "idle" | "saving" | "uploading" | "finalizing"; progress?: number }>({ name: "idle" });
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const transcriber = useTranscriber({
    onDone: (text) => setDraft((d) => (d.transcript ? d : { ...d, transcript: text, transcriptSkipped: false })),
  });

  const update = (patch: Partial<TextDraft>) => setDraft((d) => ({ ...d, ...patch }));

  // Keep the text draft in this tab (sessionStorage) and the recording in IndexedDB.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }, [draft]);

  const acceptAudio = useCallback(async (blob: Blob, mime: string) => {
    setAudioError(null);
    if (blob.size > LIMITS.audioBytes) {
      setAudioError("This file is larger than 20 MB. Please choose a shorter or smaller recording.");
      return;
    }
    try {
      const info = await analyse(blob);
      if (info.durationS > MAX_SECONDS + 5) {
        setAudioError("This recording is longer than 5 minutes. Please choose a shorter one.");
        return;
      }
      const next = { blob, mime, ...info };
      setAudio(next);
      void set(AUDIO_KEY, next).catch(() => undefined);
    } catch {
      setAudioError("We couldn't read this file. Please try another format (MP3, M4A, WAV, OGG or WebM).");
    }
  }, []);

  useEffect(() => {
    get<AudioDraft>(AUDIO_KEY)
      .then((saved) => saved && setAudio(saved))
      .catch(() => undefined);
  }, []);

  const audioUrl = useMemo(() => (audio ? URL.createObjectURL(audio.blob) : null), [audio]);
  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  // Song chosen from search results (?provider=…&pid=…): save it, then continue.
  useEffect(() => {
    if (!pick || initialSong) return;
    let cancelled = false;
    pickSong(pick).then((s) => {
      if (cancelled) return;
      setPicking(false);
      if (s) {
        setSong(s);
        setStep(1);
        router.replace(`/submit?song=${s.id}`, { scroll: false });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pick, initialSong, router]);

  const recorder = useRecorder({ onFinished: acceptAudio });

  const isVoice = draft.mode !== "write";
  const format = !isVoice ? "text" : draft.addText && draft.bodyText.trim() ? "text_audio" : "audio";
  const steps = useMemo(
    () => (isVoice ? ["Song", "Your story", "Transcript", "About you", "Send"] : ["Song", "Your story", "About you", "Send"]),
    [isVoice],
  );
  const stepName = steps[step];

  const go = (next: number) => {
    setErrors({});
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (stepName === "Song" && !song) e.song = "Please choose your song first.";
    if (stepName === "Your story") {
      if (draft.mode === "write" && draft.bodyText.trim().length < 20) e.bodyText = "Please write at least a couple of sentences.";
      if (isVoice && !audio) e.audio = draft.mode === "record" ? "Please record your story first." : "Please choose a recording.";
    }
    if (stepName === "Transcript" && !draft.transcript.trim() && !draft.transcriptSkipped) {
      e.transcript = "Add the transcript, or choose to let our team add it.";
    }
    if (stepName === "About you") {
      if (!draft.pseudonym.trim()) e.pseudonym = "Please choose a name or pseudonym.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) e.email = "Please enter a valid email address.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validateStep() && go(step + 1);

  const submit = async () => {
    setFormError(null);
    const e: Record<string, string> = {};
    (["publication", "license", "privacy", "age", "others"] as const).forEach((k) => {
      if (!consents[k]) e[`consents.${k}`] = "Required";
    });
    if (isVoice && !consents.voice) e["consents.voice"] = "Required for voice stories";
    setErrors(e);
    if (Object.keys(e).length) {
      setFormError("Please tick the required boxes.");
      return;
    }
    if (!song) return;
    setPhase({ name: "saving" });
    const altcha = new FormData(formRef.current ?? undefined).get("altcha");
    const result = await submitStory({
      songId: song.id,
      format,
      bodyText: draft.mode === "write" || draft.addText ? draft.bodyText : undefined,
      transcript: isVoice ? draft.transcript : undefined,
      transcriptReviewed: draft.transcriptReviewed,
      audio: isVoice && audio ? { mime: audio.mime, bytes: audio.blob.size, durationS: Math.max(1, audio.durationS), peaks: audio.peaks } : null,
      title: draft.title,
      pseudonym: draft.pseudonym,
      email: draft.email.trim(),
      placeNote: draft.placeNote,
      tagIds: draft.tagIds,
      consents: consents as SubmissionInput["consents"],
      altcha: typeof altcha === "string" ? altcha : "",
      website: (new FormData(formRef.current ?? undefined).get("website") as string) || undefined,
    });
    if (!result.ok) {
      setPhase({ name: "idle" });
      setFormError(result.message);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      return;
    }
    if (result.upload && audio) {
      setPhase({ name: "uploading", progress: 0 });
      let uploaded = false;
      for (let attempt = 0; attempt < 3 && !uploaded; attempt++) {
        uploaded = await uploadWithProgress(result.upload.signedUrl, audio.blob, (p) => setPhase({ name: "uploading", progress: p }));
      }
      if (!uploaded) {
        setPhase({ name: "idle" });
        setFormError("The upload didn't work. Check your connection and press Send again. Your recording is kept on this device.");
        return;
      }
      setPhase({ name: "finalizing" });
      const done = await finalizeAudio({ storyId: result.storyId, uploadToken: result.upload.token, path: result.upload.path });
      if (!done.ok) {
        setPhase({ name: "idle" });
        setFormError(done.message ?? "Something went wrong with the recording.");
        return;
      }
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    await del(AUDIO_KEY).catch(() => undefined);
    router.push("/submit/sent");
  };

  const busy = phase.name !== "idle";
  const t = transcriber.state;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        if (stepName === "Send") void submit();
        else next();
      }}
      className="flex flex-col gap-8"
      noValidate
    >
      <Stepper steps={steps} current={step} />

      {/* Song (shown on every step as context) */}
      <section aria-label="Your song" className="rounded-lg border border-border bg-surface-raised p-4">
        {picking ? (
          <p className="text-fg-muted" role="status">
            Getting the song details…
          </p>
        ) : song && !changingSong ? (
          <div className="flex items-center gap-4">
            <Artwork url={song.artworkUrl} alt="" className="size-16 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Your song</p>
              <p className="truncate font-display text-xl">{song.title}</p>
              <p className="truncate text-fg-muted">{[song.artist, song.releaseYear].filter(Boolean).join(" · ")}</p>
            </div>
            {!busy ? (
              <Button variant="ghost" size="sm" onClick={() => setChangingSong(true)}>
                Change
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Which song holds your story?</p>
            <SearchBox mode="submit" />
            {errors.song ? (
              <p role="alert" className="text-sm text-danger">
                {errors.song}
              </p>
            ) : null}
            {changingSong ? (
              <Button variant="ghost" size="sm" className="self-start" onClick={() => setChangingSong(false)}>
                Keep {song?.title}
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-24 text-3xl outline-none">
        {stepName === "Song" ? "First, find your song" : stepName === "Your story" ? "Tell your story" : stepName === "Transcript" ? "Check the transcript" : stepName === "About you" ? "About you" : "Almost done"}
      </h2>

      {stepName === "Your story" ? (
        <div className="flex flex-col gap-6">
          <div role="radiogroup" aria-label="How do you want to tell it?" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                ["write", PenLine, "Write it", "Up to 5,000 characters"],
                ["record", Mic, "Record it", "Up to 5 minutes, in your browser"],
                ["upload", Upload, "Upload a recording", "MP3, M4A, WAV, OGG, WebM · 20 MB"],
              ] as const
            ).map(([mode, Icon, label, hint]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={draft.mode === mode}
                onClick={() => update({ mode })}
                className={cx(
                  "flex flex-col items-start gap-1 rounded-lg border p-4 text-left",
                  draft.mode === mode ? "border-accent bg-accent-soft" : "border-border bg-surface-raised hover:bg-surface",
                )}
              >
                <Icon className="size-5 text-accent" aria-hidden />
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-fg-muted">{hint}</span>
              </button>
            ))}
          </div>

          {draft.mode === "write" ? (
            <Field id="bodyText" label="Your story" error={errors.bodyText} hint="Plain text. Leave an empty line between paragraphs.">
              <TextArea
                id="bodyText"
                rows={12}
                maxLength={LIMITS.storyText}
                value={draft.bodyText}
                onChange={(e) => update({ bodyText: e.target.value })}
                invalid={Boolean(errors.bodyText)}
                hasHint
                placeholder="Where were you? Who were you with? What does this song bring back?"
              />
            </Field>
          ) : (
            <div className="flex flex-col gap-4">
              {audio && audioUrl ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
                  <p className="inline-flex items-center gap-2 font-semibold">
                    <FileAudio className="size-5 text-accent" aria-hidden /> Your recording · {formatTime(audio.durationS)}
                  </p>
                  <Waveform peaks={audio.peaks} />
                  <audio controls src={audioUrl} className="w-full" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setAudio(null);
                      recorder.reset();
                      update({ transcript: "", transcriptReviewed: false, transcriptSkipped: false });
                      void del(AUDIO_KEY).catch(() => undefined);
                    }}
                  >
                    Remove and start again
                  </Button>
                </div>
              ) : draft.mode === "record" ? (
                <RecorderPanel
                  status={recorder.status}
                  elapsed={recorder.elapsed}
                  maxSeconds={MAX_SECONDS}
                  level={recorder.level}
                  onStart={recorder.start}
                  onStop={recorder.stop}
                  onPause={recorder.pause}
                  onResume={recorder.resume}
                  onReset={recorder.reset}
                />
              ) : (
                <Field id="audioFile" label="Choose a recording" hint="MP3, M4A, WAV, OGG or WebM. Up to 5 minutes and 20 MB." error={audioError}>
                  <input
                    id="audioFile"
                    type="file"
                    accept={ACCEPTED_UPLOAD_TYPES.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void acceptAudio(file, file.type || "audio/mpeg");
                    }}
                    className="rounded-md border border-dashed border-border-strong bg-surface p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-accent-fg"
                  />
                </Field>
              )}
              {errors.audio ? (
                <p role="alert" className="text-sm text-danger">
                  {errors.audio}
                </p>
              ) : null}
              {audioError && draft.mode === "record" ? (
                <p role="alert" className="text-sm text-danger">
                  {audioError}
                </p>
              ) : null}
              <Checkbox id="addText" checked={draft.addText} onChange={(addText) => update({ addText })}>
                Also add a short written introduction (optional)
              </Checkbox>
              {draft.addText ? (
                <Field id="bodyTextIntro" label="Written introduction" optional>
                  <TextArea id="bodyTextIntro" rows={4} maxLength={LIMITS.storyText} value={draft.bodyText} onChange={(e) => update({ bodyText: e.target.value })} />
                </Field>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {stepName === "Transcript" && audio ? (
        <div className="flex flex-col gap-5">
          <p className="text-fg-muted">
            Every voice story gets a written transcript, so everyone can read it (including people who can&apos;t listen).
          </p>
          {t.status === "available" && !draft.transcript ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
              <p className="inline-flex items-center gap-2 font-semibold">
                <Sparkles className="size-5 text-accent" aria-hidden /> Transcribe automatically
              </p>
              <p className="text-sm text-fg-muted">
                Runs on this device: your recording isn&apos;t sent anywhere. The first time, your browser downloads the speech
                model (about {t.device === "webgpu" ? "80" : "40"} MB). It takes about {estimateMinutes(t.device, audio.durationS)}{" "}
                minute{estimateMinutes(t.device, audio.durationS) === 1 ? "" : "s"}. You can keep filling in the form meanwhile.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => transcriber.transcribe(audio.blob, t.device)}>Start transcribing</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    update({ transcriptSkipped: true });
                    go(step + 1);
                  }}
                >
                  Skip: let the team add it
                </Button>
              </div>
            </div>
          ) : null}
          {t.status === "downloading" ? (
            <div role="status" className="flex flex-col gap-2">
              <p className="text-sm">Downloading the speech model… {Math.round(t.progress * 100)}%</p>
              <progress max={1} value={t.progress} className="w-full accent-(--color-accent)" />
              <Button variant="ghost" size="sm" className="self-start" onClick={transcriber.cancel}>
                Cancel
              </Button>
            </div>
          ) : null}
          {t.status === "transcribing" ? (
            <div role="status" className="flex flex-col gap-2 rounded-lg bg-surface p-4">
              <p className="text-sm font-semibold">Listening to your recording…</p>
              <p className="font-body text-fg-muted">{t.text || "…"}</p>
            </div>
          ) : null}
          {t.status === "unavailable" && !draft.transcript ? (
            <p className="rounded-lg bg-surface p-4 text-sm text-fg-muted">
              Automatic transcription would be very slow on this device. You can type the transcript below, or skip and our team
              will add it before publishing.
            </p>
          ) : null}
          {t.status === "error" ? (
            <p role="alert" className="text-sm text-danger">
              Automatic transcription didn&apos;t work ({t.message}). You can type it below, or skip.
            </p>
          ) : null}
          <Field
            id="transcript"
            label="Transcript"
            error={errors.transcript}
            hint="Correct any mistakes, especially names and places. It's published next to your recording."
          >
            <TextArea
              id="transcript"
              rows={10}
              maxLength={LIMITS.transcript}
              value={draft.transcript}
              onChange={(e) => update({ transcript: e.target.value, transcriptSkipped: false })}
              invalid={Boolean(errors.transcript)}
              hasHint
            />
          </Field>
          {draft.transcript ? (
            <Checkbox id="transcriptReviewed" checked={draft.transcriptReviewed} onChange={(v) => update({ transcriptReviewed: v })}>
              I&apos;ve read the transcript and it matches what I said.
            </Checkbox>
          ) : null}
          {!draft.transcript && t.status !== "available" ? (
            <Checkbox id="transcriptSkipped" checked={draft.transcriptSkipped} onChange={(v) => update({ transcriptSkipped: v })}>
              Skip for now: the team will add the transcript before publishing.
            </Checkbox>
          ) : null}
        </div>
      ) : null}

      {stepName === "About you" ? (
        <div className="flex flex-col gap-6">
          <Field id="pseudonym" label="Your name or pseudonym" hint="Shown with your story. It doesn't have to be your real name." error={errors.pseudonym}>
            <TextInput id="pseudonym" value={draft.pseudonym} maxLength={LIMITS.pseudonym} autoComplete="nickname" onChange={(e) => update({ pseudonym: e.target.value })} invalid={Boolean(errors.pseudonym)} hasHint />
          </Field>
          <Field
            id="email"
            label="Your email"
            hint="Never shown. Used only to confirm your story and send you a private link to edit or remove it."
            error={errors.email}
          >
            <TextInput id="email" type="email" inputMode="email" autoComplete="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} invalid={Boolean(errors.email)} hasHint />
          </Field>
          <Field id="title" label="A title for your story" optional>
            <TextInput id="title" value={draft.title} maxLength={LIMITS.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field id="placeNote" label="Where and when" optional hint="For example: “Naples, summer 1998”.">
            <TextInput id="placeNote" value={draft.placeNote} maxLength={LIMITS.placeNote} onChange={(e) => update({ placeNote: e.target.value })} hasHint />
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold">
              What is your story about? <span className="font-normal text-fg-subtle">(up to {LIMITS.maxTags}, optional)</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = draft.tagIds.includes(tag.id);
                const full = draft.tagIds.length >= LIMITS.maxTags;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={!selected && full}
                    onClick={() => update({ tagIds: selected ? draft.tagIds.filter((x) => x !== tag.id) : [...draft.tagIds, tag.id] })}
                    className={cx(
                      "min-h-10 rounded-full border px-4 text-sm disabled:opacity-40",
                      selected ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-raised hover:bg-surface",
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      ) : null}

      {stepName === "Send" ? (
        <div className="flex flex-col gap-4">
          <p className="text-fg-muted">
            Please read and tick the boxes below. You can withdraw your consent and remove your story at any time.
          </p>
          <Checkbox id="c-publication" checked={consents.publication} invalid={Boolean(errors["consents.publication"])} onChange={(v) => setConsents((c) => ({ ...c, publication: v }))}>
            {consentTexts.publication}
          </Checkbox>
          <Checkbox id="c-license" checked={consents.license} invalid={Boolean(errors["consents.license"])} onChange={(v) => setConsents((c) => ({ ...c, license: v }))}>
            {consentTexts.license}{" "}
            <a href="/license" target="_blank" className="text-accent underline">
              Read the story licence
            </a>
          </Checkbox>
          {isVoice ? (
            <Checkbox id="c-voice" checked={consents.voice} invalid={Boolean(errors["consents.voice"])} onChange={(v) => setConsents((c) => ({ ...c, voice: v }))}>
              {consentTexts.voice}
            </Checkbox>
          ) : null}
          <Checkbox id="c-others" checked={consents.others} invalid={Boolean(errors["consents.others"])} onChange={(v) => setConsents((c) => ({ ...c, others: v }))}>
            {consentTexts.others}
          </Checkbox>
          <Checkbox id="c-age" checked={consents.age} invalid={Boolean(errors["consents.age"])} onChange={(v) => setConsents((c) => ({ ...c, age: v }))}>
            {consentTexts.age}
          </Checkbox>
          <Checkbox id="c-privacy" checked={consents.privacy} invalid={Boolean(errors["consents.privacy"])} onChange={(v) => setConsents((c) => ({ ...c, privacy: v }))}>
            {consentTexts.privacy}{" "}
            <a href="/privacy" target="_blank" className="text-accent underline">
              Privacy Policy
            </a>
          </Checkbox>
          <Checkbox id="c-promotion" checked={consents.promotion} onChange={(v) => setConsents((c) => ({ ...c, promotion: v }))}>
            {consentTexts.promotion}
          </Checkbox>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <ShieldCheck className="size-4" aria-hidden /> A quick, private spam check runs in your browser:
          </div>
          <AltchaField onVerified={setHuman} />
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="rounded-md border border-danger p-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      {phase.name === "uploading" ? (
        <div role="status" className="flex flex-col gap-2">
          <p className="text-sm">Uploading your recording… {Math.round((phase.progress ?? 0) * 100)}%</p>
          <progress max={1} value={phase.progress ?? 0} className="w-full" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={busy}>
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>
        ) : (
          <span />
        )}
        {stepName === "Send" ? (
          <Button type="submit" size="lg" loading={busy} disabled={!human}>
            {!human ? "Running the spam check…" : phase.name === "finalizing" ? "Checking your recording…" : "Send my story"}
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={stepName === "Song" && !song}>
            Continue <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </form>
  );
}

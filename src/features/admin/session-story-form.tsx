"use client";
import { del, set } from "idb-keyval";
import { Mic, PenLine } from "lucide-react";
import { useState } from "react";
import { RecorderPanel } from "@/components/patterns/recorder-panel";
import { Waveform } from "@/components/patterns/waveform";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextArea, TextInput } from "@/components/ui/field";
import { cx, formatTime } from "@/components/ui/utils";
import { LIMITS } from "@/config/limits";
import { consentTexts } from "@/content/legal";
import { analyse, MAX_SECONDS } from "@/features/submission/audio";
import { uploadWithProgress } from "@/features/submission/upload";
import { useRecorder } from "@/features/submission/use-recorder";
import { createSessionStory, finalizeSessionAudio } from "./session-actions";

interface Recording {
  backupKey: string;
  blob: Blob;
  mime: string;
  durationS: number;
  peaks: number[];
}

/**
 * A participant's story, recorded or written on the admin's phone during a session.
 * The recording is saved on the phone (IndexedDB) until the upload succeeds.
 */
export function SessionStoryForm({ playlistId, songId, onSaved }: { playlistId: string; songId: string; onSaved: () => void }) {
  const [mode, setMode] = useState<"record" | "write">("record");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [fields, setFields] = useState({ pseudonym: "", email: "", title: "", bodyText: "", transcript: "" });
  const [consents, setConsents] = useState({ publication: false, license: false, age: false, privacy: false, voice: false, promotion: false });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const recorder = useRecorder({
    onFinished: async (blob, mime) => {
      const backupKey = `bl:session-audio:${Date.now()}`;
      await set(backupKey, { blob, mime, playlistId, songId }).catch(() => undefined);
      try {
        const info = await analyse(blob);
        setRecording({ backupKey, blob, mime, ...info });
      } catch {
        setStatus("The recording couldn't be read. Please record again.");
      }
    },
  });

  const consentOk = consents.publication && consents.license && consents.age && consents.privacy && (mode === "write" || consents.voice);

  const save = async () => {
    setStatus(null);
    if (!fields.pseudonym.trim()) return setStatus("Please add the participant's name or pseudonym.");
    if (mode === "write" && !fields.bodyText.trim()) return setStatus("Please write the story.");
    if (mode === "record" && !recording) return setStatus("Please record the story first.");
    if (!consentOk) return setStatus("The participant needs to tick the consent boxes.");
    setBusy(true);
    const r = await createSessionStory({
      playlistId,
      songId,
      ...fields,
      audio: mode === "record" && recording ? { mime: recording.mime, durationS: Math.max(1, recording.durationS), peaks: recording.peaks } : null,
      consents: consents as never,
    });
    if (!r.ok) {
      setBusy(false);
      return setStatus(r.message);
    }
    if (r.upload && recording) {
      let uploaded = false;
      for (let i = 0; i < 3 && !uploaded; i++) {
        uploaded = await uploadWithProgress(r.upload.signedUrl, recording.blob, (p) => setStatus(`Uploading… ${Math.round(p * 100)}%`));
      }
      if (!uploaded) {
        setBusy(false);
        return setStatus("Upload failed (no connection?). The recording is saved on this phone: try Save again when you're back online.");
      }
      const done = await finalizeSessionAudio(r.storyId!, r.upload.path);
      if (!done.ok) {
        setBusy(false);
        return setStatus(done.message);
      }
      await del(recording.backupKey).catch(() => undefined);
    }
    setBusy(false);
    onSaved();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How is the story told?">
        {(
          [
            ["record", Mic, "Record"],
            ["write", PenLine, "Write"],
          ] as const
        ).map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cx("flex min-h-12 items-center justify-center gap-2 rounded-lg border", mode === m ? "border-accent bg-accent-soft" : "border-border")}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === "record" ? (
        recording ? (
          <div className="flex flex-col gap-2 rounded-lg bg-surface p-4">
            <p className="text-sm font-semibold">Recorded · {formatTime(recording.durationS)}</p>
            <Waveform peaks={recording.peaks} />
            <Button variant="ghost" size="sm" className="self-start" onClick={() => { setRecording(null); recorder.reset(); }}>
              Record again
            </Button>
          </div>
        ) : (
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
        )
      ) : (
        <Field id="ss-body" label="The story">
          <TextArea id="ss-body" rows={8} maxLength={LIMITS.storyText} value={fields.bodyText} onChange={(e) => setFields({ ...fields, bodyText: e.target.value })} />
        </Field>
      )}

      <Field id="ss-name" label="Participant's name or pseudonym">
        <TextInput id="ss-name" value={fields.pseudonym} maxLength={LIMITS.pseudonym} onChange={(e) => setFields({ ...fields, pseudonym: e.target.value })} />
      </Field>
      <Field id="ss-email" label="Participant's email" optional hint="Only if they want a private link to edit or remove their story later.">
        <TextInput id="ss-email" type="email" value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} hasHint />
      </Field>
      <Field id="ss-title" label="Title" optional>
        <TextInput id="ss-title" value={fields.title} maxLength={LIMITS.title} onChange={(e) => setFields({ ...fields, title: e.target.value })} />
      </Field>
      {mode === "record" ? (
        <Field id="ss-tr" label="Transcript" optional hint="You can also generate it later from the Review page.">
          <TextArea id="ss-tr" rows={4} maxLength={LIMITS.transcript} value={fields.transcript} onChange={(e) => setFields({ ...fields, transcript: e.target.value })} hasHint />
        </Field>
      ) : null}

      <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Hand the phone to the participant: please read and tick</legend>
        <Checkbox id="ss-c1" checked={consents.publication} onChange={(v) => setConsents({ ...consents, publication: v })}>{consentTexts.publication}</Checkbox>
        <Checkbox id="ss-c2" checked={consents.license} onChange={(v) => setConsents({ ...consents, license: v })}>{consentTexts.license}</Checkbox>
        {mode === "record" ? (
          <Checkbox id="ss-c3" checked={consents.voice} onChange={(v) => setConsents({ ...consents, voice: v })}>{consentTexts.voice}</Checkbox>
        ) : null}
        <Checkbox id="ss-c4" checked={consents.age} onChange={(v) => setConsents({ ...consents, age: v })}>{consentTexts.age}</Checkbox>
        <Checkbox id="ss-c5" checked={consents.privacy} onChange={(v) => setConsents({ ...consents, privacy: v })}>{consentTexts.privacy}</Checkbox>
        <Checkbox id="ss-c6" checked={consents.promotion} onChange={(v) => setConsents({ ...consents, promotion: v })}>{consentTexts.promotion}</Checkbox>
      </fieldset>

      {status ? (
        <p role="status" className="text-sm text-fg-muted">
          {status}
        </p>
      ) : null}
      <Button size="lg" onClick={save} loading={busy}>
        Save this story
      </Button>
      <p className="text-xs text-fg-subtle">
        Session stories go into the archive when you publish the session. Tip: recordings are kept on this phone until the upload
        succeeds.
      </p>
    </div>
  );
}

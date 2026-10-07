"use client";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { LIMITS } from "@/config/limits";
import { deleteMyEmail, deleteMyStory, submitEdit, type ActionState } from "@/features/manage/actions";

export interface ManagedStory {
  format: "text" | "audio" | "text_audio";
  title: string;
  bodyText: string;
  transcript: string;
  pseudonym: string;
  placeNote: string;
  hasEmail: boolean;
  hasPendingEdit: boolean;
}

export function EditPanel({ story }: { story: ManagedStory }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitEdit, { status: "idle" });
  const [values, setValues] = useState(story);
  if (state.status === "done") {
    return (
      <p role="status" className="rounded-lg bg-surface p-5">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5">
      {story.hasPendingEdit ? (
        <p className="rounded-md bg-accent-soft p-3 text-sm">You already sent an edit. A new one replaces it.</p>
      ) : null}
      <Field id="pseudonym" label="Name or pseudonym">
        <TextInput
          id="pseudonym"
          name="pseudonym"
          required
          maxLength={LIMITS.pseudonym}
          value={values.pseudonym}
          onChange={(e) => setValues({ ...values, pseudonym: e.target.value })}
        />
      </Field>
      <Field id="title" label="Title" optional>
        <TextInput id="title" name="title" maxLength={LIMITS.title} value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
      </Field>
      <Field id="placeNote" label="Where and when" optional>
        <TextInput
          id="placeNote"
          name="placeNote"
          maxLength={LIMITS.placeNote}
          value={values.placeNote}
          onChange={(e) => setValues({ ...values, placeNote: e.target.value })}
        />
      </Field>
      {story.format !== "audio" ? (
        <Field id="bodyText" label={story.format === "text" ? "Your story" : "Written introduction"}>
          <TextArea
            id="bodyText"
            name="bodyText"
            rows={10}
            maxLength={LIMITS.storyText}
            value={values.bodyText}
            onChange={(e) => setValues({ ...values, bodyText: e.target.value })}
          />
        </Field>
      ) : (
        <input type="hidden" name="bodyText" value="" />
      )}
      {story.format !== "text" ? (
        <Field id="transcript" label="Transcript of your recording">
          <TextArea
            id="transcript"
            name="transcript"
            rows={8}
            maxLength={LIMITS.transcript}
            value={values.transcript}
            onChange={(e) => setValues({ ...values, transcript: e.target.value })}
          />
        </Field>
      ) : (
        <input type="hidden" name="transcript" value="" />
      )}
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="self-start">
        Send my changes for review
      </Button>
    </form>
  );
}

export function EmailPanel({ hasEmail }: { hasEmail: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!hasEmail) return <p className="text-sm text-fg-muted">We no longer store an email address for this story.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-muted">
        We keep your email only to contact you about this story. You can delete it: this private link keeps working, but we
        won&apos;t be able to email you (for example, if your story is reported).
      </p>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : (
        <Button
          variant="secondary"
          loading={pending}
          className="self-start"
          onClick={() => start(async () => setMessage((await deleteMyEmail()).message ?? null))}
        >
          Delete my email address
        </Button>
      )}
    </div>
  );
}

export function DeletePanel() {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteMyStory, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-fg-muted">This permanently deletes your story, its recording and your email. It can&apos;t be undone.</p>
      <Field id="confirm" label="Type DELETE to confirm" error={state.status === "error" ? state.message : null}>
        <TextInput id="confirm" name="confirm" autoComplete="off" className="max-w-48" />
      </Field>
      <Button type="submit" variant="danger" loading={pending} className="self-start">
        Delete my story permanently
      </Button>
    </form>
  );
}

"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { confirmStory, type VerifyState } from "@/features/submission/verify-actions";

const messages: Record<Exclude<VerifyState["status"], "idle">, { title: string; text: string }> = {
  confirmed: {
    title: "Thank you. Your story is confirmed.",
    text: "We read every story before it goes into the archive. You'll get an email when it's published, with a private link to edit or remove it.",
  },
  invalid: {
    title: "This link doesn't work.",
    text: "It may have been used already. If you confirmed before, there's nothing else to do.",
  },
  expired: {
    title: "This link has expired.",
    text: "Confirmation links work for 72 hours. Please share your story again. It only takes a minute.",
  },
  "waiting-audio": {
    title: "Your recording hasn't arrived yet.",
    text: "Please wait for the upload to finish on the page where you recorded, then try this link again.",
  },
};

export function ConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(confirmStory, { status: "idle" });
  if (state.status !== "idle") {
    const m = messages[state.status];
    return (
      <div className="flex flex-col gap-4" role="status">
        <h1 className="text-4xl">{m.title}</h1>
        <p className="font-body text-lg text-fg-muted">{m.text}</p>
        <div className="flex gap-3">
          {state.status === "expired" ? <LinkButton href="/submit">Share again</LinkButton> : null}
          <LinkButton href="/archive" variant="secondary">
            Browse the archive
          </LinkButton>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-4xl">Confirm your story</h1>
      <p className="font-body text-lg text-fg-muted">One click and your story goes to our review queue.</p>
      <input type="hidden" name="token" value={token} />
      <div>
        <Button type="submit" size="lg" loading={pending}>
          Confirm my story
        </Button>
      </div>
    </form>
  );
}

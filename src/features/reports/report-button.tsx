"use client";
import { Flag } from "lucide-react";
import { useActionState, useState } from "react";
import { Dialog } from "@/components/patterns/dialog";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { AltchaField } from "@/features/captcha/altcha-field";
import { reportStory, type ReportState } from "./actions";
import { REASON_LABELS } from "./reasons";

export function ReportButton({ storyId }: { storyId: string }) {
  const [open, setOpen] = useState(false);
  const [human, setHuman] = useState(false);
  const [state, action, pending] = useActionState<ReportState, FormData>(reportStory, { status: "idle" });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={copy.story.report}
      description="Tell us what's wrong. We review every report."
      trigger={
        <button type="button" className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg">
          <Flag className="size-4" aria-hidden />
          {copy.story.report}
        </button>
      }
    >
      {state.status === "sent" ? (
        <div className="flex flex-col gap-4">
          <p>Thank you. We&apos;ll look at this story soon.</p>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="storyId" value={storyId} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Reason</legend>
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3">
                <input type="radio" name="reason" value={value} required className="size-4 accent-(--color-accent)" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Anything else we should know? (optional)
            <textarea
              name="details"
              maxLength={1000}
              rows={3}
              className="rounded-md border border-border-strong bg-surface-raised p-3 font-normal"
            />
          </label>
          {/* Honeypot: hidden from people, tempting for bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <AltchaField onVerified={setHuman} />
          {state.status === "error" ? (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          ) : null}
          <Button type="submit" loading={pending} disabled={!human}>
            {human ? "Send report" : "Checking you're not a robot…"}
          </Button>
        </form>
      )}
    </Dialog>
  );
}

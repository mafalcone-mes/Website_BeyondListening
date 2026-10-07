"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { sendLoginLink, type LoginState } from "@/features/admin/login-actions";

export function LoginForm({ localInbox }: { localInbox: string | null }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLoginLink, { status: "idle" });
  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="font-display text-2xl">Check your email</p>
        <p className="text-fg-muted">If this address belongs to an admin, a login link is on its way. It works once, for one hour.</p>
        {localInbox ? (
          <a href={localInbox} target="_blank" rel="noreferrer" className="font-medium text-accent underline">
            Open the local inbox
          </a>
        ) : null}
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label="Your email" error={state.status === "error" ? state.message : null}>
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        Send me a login link
      </Button>
    </form>
  );
}

"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { AltchaField } from "@/features/captcha/altcha-field";
import { requestManageLinks, type ActionState } from "@/features/manage/actions";

export function RequestLinksForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestManageLinks, { status: "idle" });
  const [human, setHuman] = useState(false);
  if (state.status === "done") {
    return (
      <p role="status" className="rounded-lg bg-surface p-5">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label="The email you used" error={state.status === "error" ? state.message : null}>
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <AltchaField onVerified={setHuman} />
      <Button type="submit" loading={pending} disabled={!human} className="self-start">
        Email me my private links
      </Button>
    </form>
  );
}

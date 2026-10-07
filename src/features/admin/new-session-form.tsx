"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { createPlaylist } from "./session-actions";

export function NewSessionForm({ today }: { today: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sessionDate, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createPlaylist({ title, sessionDate, location, description: "" });
          if (r.ok && r.id) router.push(`/admin/sessions/${r.id}`);
          else setError(r.message ?? "Couldn't create the session.");
        });
      }}
    >
      <h2 className="text-2xl">New session</h2>
      <Field id="ns-title" label="Title" error={error}>
        <TextInput id="ns-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session #2 — Late summer" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="ns-date" label="Date">
          <TextInput id="ns-date" type="date" value={sessionDate} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field id="ns-loc" label="Place" optional>
          <TextInput id="ns-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" size="lg" loading={pending}>
        Create and start adding songs
      </Button>
    </form>
  );
}

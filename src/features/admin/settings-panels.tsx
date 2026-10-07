"use client";
import { downloadZip } from "client-zip";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { runMaintenanceNow, saveSettings } from "./misc-actions";

export function SettingsForm({
  initial,
}: {
  initial: { projectStory: string; contactEmail: string; adminNotifications: "instant" | "digest" | "off" };
}) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <Field id="st-story" label="The project's story" hint="Shown on the home page and the About page.">
        <TextArea id="st-story" rows={6} maxLength={3000} value={form.projectStory} onChange={(e) => setForm({ ...form, projectStory: e.target.value })} hasHint />
      </Field>
      <Field id="st-contact" label="Contact email for visitors" optional hint="Used in the privacy policy and for removal requests.">
        <TextInput id="st-contact" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} hasHint />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Email me when new stories are waiting</legend>
        {(
          [
            ["instant", "Straight away (at most once an hour)"],
            ["digest", "Once a day"],
            ["off", "Never"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm">
            <input type="radio" name="notify" checked={form.adminNotifications === value} onChange={() => setForm({ ...form, adminNotifications: value })} className="size-4 accent-(--color-accent)" />
            {label}
          </label>
        ))}
      </fieldset>
      {message ? (
        <p role="status" className="text-sm text-fg-muted">
          {message}
        </p>
      ) : null}
      <Button className="self-start" loading={pending} onClick={() => start(async () => setMessage((await saveSettings(form)).message ?? null))}>
        Save settings
      </Button>
    </div>
  );
}

export function MaintenanceButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        className="self-start"
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await runMaintenanceNow();
            const parts = r.report ? Object.entries(r.report).filter(([, n]) => n).map(([k, n]) => `${k}: ${n}`) : [];
            setMessage(`${r.message ?? ""} ${parts.length ? parts.join(", ") : "Nothing to clean up."}`);
          })
        }
      >
        Run maintenance now
      </Button>
      {message ? (
        <p role="status" className="text-sm text-fg-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** Downloads the whole archive (data + recordings) as one ZIP, built in the browser. */
export function ExportButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      setStatus("Collecting the data…");
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error();
      const exp = (await res.json()) as { exportedAt: string; data: Record<string, unknown[]>; audio: { path: string; url: string }[] };
      const files: { name: string; input: string | Blob; lastModified?: Date }[] = [
        { name: "README.txt", input: "Beyond Listening export.\nThe JSON files contain everything in the archive, including contributor emails (personal data): keep this file safe.\n" },
        ...Object.entries(exp.data).map(([name, rows]) => ({ name: `data/${name}.json`, input: JSON.stringify(rows, null, 2) })),
      ];
      let i = 0;
      for (const a of exp.audio) {
        i += 1;
        setStatus(`Downloading recordings… ${i} / ${exp.audio.length}`);
        const blob = await fetch(a.url).then((r) => (r.ok ? r.blob() : null));
        if (blob) files.push({ name: a.path, input: blob });
      }
      setStatus("Creating the ZIP file…");
      const zip = await downloadZip(files).blob();
      const url = URL.createObjectURL(zip);
      const link = document.createElement("a");
      link.href = url;
      link.download = `beyond-listening-export-${exp.exportedAt.slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus(`Done: ${exp.data.stories?.length ?? 0} stories and ${exp.audio.length} recordings.`);
    } catch {
      setStatus("The export didn't work. Please try again.");
    }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" className="self-start" loading={busy} onClick={run}>
        Download everything (ZIP)
      </Button>
      {status ? (
        <p role="status" className="text-sm text-fg-muted">
          {status}
        </p>
      ) : null}
    </div>
  );
}

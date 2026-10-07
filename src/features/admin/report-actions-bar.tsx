"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveReport } from "./story-actions";

export function ReportActionsBar({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const act = (action: "dismiss" | "unpublish" | "delete") =>
    start(async () => {
      const r = await resolveReport(reportId, action);
      setMessage(r.message ?? null);
      if (r.ok) router.refresh();
    });
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button variant="secondary" disabled={pending} onClick={() => act("dismiss")}>
          It&apos;s fine: dismiss
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => act("unpublish")}>
          Hide the story
        </Button>
        {confirmDelete ? (
          <Button variant="danger" loading={pending} onClick={() => act("delete")}>
            Yes, delete forever
          </Button>
        ) : (
          <Button variant="ghost" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Delete the story…
          </Button>
        )}
      </div>
      {message ? (
        <p role="status" className="text-sm text-fg-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}

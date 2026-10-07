"use client";
import dynamic from "next/dynamic";

/** The wizard needs the browser (microphone, storage, workers): render it on the client only. */
export const SubmitWizardLoader = dynamic(() => import("./submit-wizard").then((m) => m.SubmitWizard), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-surface" aria-label="Loading the form" />,
});

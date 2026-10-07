import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/components/ui/utils";

export interface RecorderPanelProps {
  status: "idle" | "requesting" | "denied" | "unsupported" | "recording" | "paused" | "done";
  elapsed: number;
  maxSeconds: number;
  level: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/** Microphone recorder UI. Presentational only. */
export function RecorderPanel(p: RecorderPanelProps) {
  const live = p.status === "recording" || p.status === "paused";
  const remaining = Math.max(0, p.maxSeconds - p.elapsed);
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-6 text-center">
      {p.status === "denied" ? (
        <p role="alert" className="text-danger">
          We couldn&apos;t use your microphone. Please allow microphone access in your browser settings, or upload a recording
          instead.
        </p>
      ) : p.status === "unsupported" ? (
        <p role="alert" className="text-danger">
          This browser can&apos;t record audio. Please try another browser, or upload a recording instead.
        </p>
      ) : null}

      <div className="relative flex size-28 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent-soft transition-transform duration-(--duration-fast)"
          style={{ transform: `scale(${live ? 0.75 + p.level * 0.6 : 0.75})` }}
        />
        <Mic className="relative size-10 text-accent" aria-hidden />
      </div>

      <p className="font-mono text-3xl tabular-nums" aria-live="off">
        {formatTime(p.elapsed)}
      </p>
      <p className="text-sm text-fg-subtle" aria-live="polite">
        {p.status === "recording"
          ? `Recording… ${formatTime(remaining)} left`
          : p.status === "paused"
            ? "Paused"
            : p.status === "requesting"
              ? "Waiting for microphone permission…"
              : `Up to ${p.maxSeconds / 60} minutes. Find a quiet spot and take your time.`}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {!live ? (
          <Button size="lg" onClick={p.onStart} loading={p.status === "requesting"}>
            <Mic className="size-5" aria-hidden />
            Start recording
          </Button>
        ) : (
          <>
            {p.status === "recording" ? (
              <Button variant="secondary" onClick={p.onPause}>
                <Pause className="size-4" aria-hidden /> Pause
              </Button>
            ) : (
              <Button variant="secondary" onClick={p.onResume}>
                <Play className="size-4" aria-hidden /> Resume
              </Button>
            )}
            <Button onClick={p.onStop}>
              <Square className="size-4" aria-hidden /> Finish
            </Button>
            <Button variant="ghost" onClick={p.onReset}>
              <RotateCcw className="size-4" aria-hidden /> Start over
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

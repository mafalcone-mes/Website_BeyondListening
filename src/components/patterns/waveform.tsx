import { cx } from "@/components/ui/utils";

/** Static waveform from precomputed peaks (0–1). Decorative. */
export function Waveform({ peaks, progress = 0, className }: { peaks: number[]; progress?: number; className?: string }) {
  if (!peaks.length) return null;
  const n = peaks.length;
  return (
    <svg viewBox={`0 0 ${n * 3} 40`} preserveAspectRatio="none" aria-hidden className={cx("h-10 w-full", className)}>
      {peaks.map((p, i) => {
        const h = Math.max(2, p * 38);
        return (
          <rect
            key={i}
            x={i * 3}
            y={20 - h / 2}
            width={2}
            height={h}
            rx={1}
            className={i / n <= progress ? "fill-accent" : "fill-border-strong"}
          />
        );
      })}
    </svg>
  );
}

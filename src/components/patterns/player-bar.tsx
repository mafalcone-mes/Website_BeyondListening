"use client";
import * as Slider from "@radix-ui/react-slider";
import { Loader2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import Link from "next/link";
import { cx, formatTime, spokenTime } from "@/components/ui/utils";
import { Artwork } from "./artwork";

export interface PlayerBarProps {
  title: string;
  subtitle: string;
  artworkUrl: string | null;
  href: string | null;
  kindLabel: string;
  status: "loading" | "playing" | "paused" | "unavailable" | "error";
  position: number;
  duration: number;
  attribution: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-player-fg " +
  "transition-opacity duration-(--duration-fast) hover:opacity-80 disabled:opacity-30";

/** The persistent player at the bottom of every page. Presentational only. */
export function PlayerBar(p: PlayerBarProps) {
  const busy = p.status === "loading";
  const problem = p.status === "unavailable" || p.status === "error";
  return (
    <section
      aria-label="Audio player"
      className="fixed inset-x-0 bottom-0 z-(--z-player) border-t border-player-fg/10 bg-player-bg text-player-fg shadow-3"
    >
      <div className="mx-auto flex h-(--player-height) max-w-page items-center gap-3 px-4">
        <Artwork url={p.artworkUrl} alt="" className="size-12 rounded-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {p.href ? (
              <Link href={p.href} className="hover:underline">
                {p.title}
              </Link>
            ) : (
              p.title
            )}
          </p>
          <p className="truncate text-xs opacity-75">
            <span className="mr-2 rounded-full border border-player-fg/30 px-2 py-0.5 uppercase tracking-wide">
              {p.kindLabel}
            </span>
            {problem ? (p.status === "unavailable" ? "No preview available" : "Couldn't play this") : p.subtitle}
          </p>
          <div className="mt-1 hidden items-center gap-2 sm:flex">
            <span className="w-10 text-right font-mono text-xs tabular-nums opacity-75">{formatTime(p.position)}</span>
            <Slider.Root
              className="relative flex h-5 flex-1 touch-none select-none items-center"
              value={[Math.min(p.position, p.duration || 0)]}
              max={p.duration || 1}
              step={1}
              disabled={!p.duration}
              onValueChange={([v]) => p.onSeek(v)}
              aria-label="Seek"
            >
              <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-player-fg/20">
                <Slider.Range className="absolute h-full bg-player-fg" />
              </Slider.Track>
              <Slider.Thumb
                className="block size-3.5 rounded-full bg-player-fg shadow-1"
                aria-valuetext={`${spokenTime(p.position)} of ${spokenTime(p.duration)}`}
              />
            </Slider.Root>
            <span className="w-10 font-mono text-xs tabular-nums opacity-75">{formatTime(p.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className={cx(iconButton, "hidden sm:inline-flex")} onClick={p.onPrevious} disabled={!p.hasPrevious && p.position < 1} aria-label="Previous">
            <SkipBack className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={p.onToggle}
            disabled={busy || problem}
            aria-label={p.status === "playing" ? "Pause" : "Play"}
            className={cx(iconButton, "size-12 bg-player-fg text-player-bg hover:opacity-90")}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : p.status === "playing" ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Play className="size-5 translate-x-px" aria-hidden />
            )}
          </button>
          <button type="button" className={iconButton} onClick={p.onNext} disabled={!p.hasNext} aria-label="Next">
            <SkipForward className="size-5" aria-hidden />
          </button>
          <button type="button" className={iconButton} onClick={p.onClose} aria-label="Close player">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      {p.attribution ? (
        <p className="sr-only">{p.attribution}</p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {p.status === "playing" ? `Playing ${p.title}` : p.status === "paused" ? "Paused" : problem ? "Not available" : ""}
      </p>
    </section>
  );
}

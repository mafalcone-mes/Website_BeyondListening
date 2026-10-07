"use client";
import { PlayToggle } from "@/components/patterns/play-toggle";
import { currentTrack, usePlayer } from "./store";
import type { Track } from "./tracks";

/** Play/pause for one track (or a list starting at `startIndex`) in the global player. */
export function PlayButton({
  tracks,
  startIndex = 0,
  label,
  size,
  variant,
}: {
  tracks: Track[];
  startIndex?: number;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline";
}) {
  const playTracks = usePlayer((s) => s.playTracks);
  const current = usePlayer(currentTrack);
  const status = usePlayer((s) => s.status);
  const isCurrent = current?.key === tracks[startIndex]?.key;
  const state = isCurrent ? status : "idle";

  return (
    <PlayToggle
      label={label}
      size={size}
      variant={variant}
      state={state === "playing" ? "playing" : state === "loading" ? "loading" : "idle"}
      disabled={tracks.length === 0}
      onClick={() => playTracks(tracks, startIndex)}
    />
  );
}

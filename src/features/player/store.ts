"use client";
import { create } from "zustand";
import type { Track } from "./tracks";

export type { Track } from "./tracks";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "unavailable" | "error";

interface PlayerState {
  queue: Track[];
  index: number;
  status: PlayerStatus;
  position: number;
  duration: number;
  attribution: string | null;
  /** increments to ask the <audio> element to seek */
  seekRequest: { to: number; n: number } | null;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  close: () => void;
  // used by the audio element only
  _set: (patch: Partial<PlayerState>) => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  status: "idle",
  position: 0,
  duration: 0,
  attribution: null,
  seekRequest: null,

  playTracks: (tracks, startIndex = 0) => {
    const current = get().queue[get().index];
    const wanted = tracks[startIndex];
    // Pressing play on what is already loaded just toggles.
    if (current && wanted && current.key === wanted.key && get().status !== "idle") {
      get().toggle();
      return;
    }
    set({ queue: tracks, index: startIndex, status: "loading", position: 0, duration: 0, attribution: null });
  },
  toggle: () => {
    const { status } = get();
    if (status === "playing") set({ status: "paused" });
    else if (status === "paused") set({ status: "playing" });
  },
  next: () => {
    const { index, queue } = get();
    if (index < queue.length - 1) set({ index: index + 1, status: "loading", position: 0, duration: 0 });
    else set({ status: "paused" });
  },
  previous: () => {
    const { index, position } = get();
    if (position > 3 || index === 0) get().seek(0);
    else set({ index: index - 1, status: "loading", position: 0, duration: 0 });
  },
  seek: (seconds) => set((s) => ({ seekRequest: { to: seconds, n: (s.seekRequest?.n ?? 0) + 1 } })),
  close: () => set({ queue: [], index: 0, status: "idle", position: 0, duration: 0, attribution: null }),
  _set: (patch) => set(patch),
}));

export const currentTrack = (s: PlayerState) => s.queue[s.index] ?? null;

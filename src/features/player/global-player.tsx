"use client";
import { useEffect, useRef } from "react";
import { PlayerBar } from "@/components/patterns/player-bar";
import { currentTrack, usePlayer, type Track } from "./store";

interface Resolved {
  url: string | null;
  attribution: string | null;
}

async function resolve(track: Track): Promise<Resolved> {
  const endpoint = track.kind === "preview" ? `/api/songs/${track.id}/preview` : `/api/stories/${track.id}/audio`;
  const res = await fetch(endpoint);
  if (!res.ok) return { url: null, attribution: null };
  const data = await res.json();
  return { url: data.url ?? null, attribution: data.attribution ?? null };
}

/**
 * The single <audio> element of the site. Lives in the root layout, so audio
 * keeps playing while visitors navigate. Only one sound plays at a time.
 */
export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const track = usePlayer(currentTrack);
  const status = usePlayer((s) => s.status);
  const seekRequest = usePlayer((s) => s.seekRequest);
  const state = usePlayer();
  const set = usePlayer((s) => s._set);

  // Load a new track whenever the current one changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    let cancelled = false;
    set({ status: "loading", position: 0, duration: 0 });
    resolve(track)
      .then(({ url, attribution }) => {
        if (cancelled) return;
        if (!url) {
          set({ status: "unavailable", attribution: null });
          return;
        }
        audio.src = url;
        set({ attribution });
        return audio.play().then(
          () => !cancelled && set({ status: "playing" }),
          () => !cancelled && set({ status: "paused" }),
        );
      })
      .catch(() => !cancelled && set({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [track, set]);

  // Keep the element in sync with play/pause requests from anywhere on the page.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (status === "playing" && audio.paused) audio.play().catch(() => set({ status: "paused" }));
    if (status === "paused" && !audio.paused) audio.pause();
    if (status === "idle") {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, [status, set]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && seekRequest && Number.isFinite(seekRequest.to)) audio.currentTime = seekRequest.to;
  }, [seekRequest]);

  // Lock-screen / headphone controls.
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.subtitle,
      artwork: track.artworkUrl ? [{ src: track.artworkUrl, sizes: "1000x1000" }] : [],
    });
    const p = usePlayer.getState();
    navigator.mediaSession.setActionHandler("play", () => usePlayer.getState()._set({ status: "playing" }));
    navigator.mediaSession.setActionHandler("pause", () => usePlayer.getState()._set({ status: "paused" }));
    navigator.mediaSession.setActionHandler("nexttrack", p.queue.length > 1 ? () => usePlayer.getState().next() : null);
    navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().previous());
  }, [track]);

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => set({ position: e.currentTarget.currentTime })}
        onDurationChange={(e) => set({ duration: e.currentTarget.duration })}
        onPlay={() => set({ status: "playing" })}
        onPause={(e) => !e.currentTarget.ended && usePlayer.getState().status === "playing" && set({ status: "paused" })}
        onEnded={() => state.next()}
        onError={(e) => e.currentTarget.getAttribute("src") && set({ status: "error" })}
      />
      {track && status !== "idle" ? (
        <>
          {/* Reserve space so the bar never covers the page footer. */}
          <div aria-hidden className="h-(--player-height)" />
          <PlayerBar
            title={track.title}
            subtitle={state.attribution ? `${track.subtitle} · ${state.attribution}` : track.subtitle}
            artworkUrl={track.artworkUrl}
            href={track.href}
            kindLabel={track.kind === "preview" ? "30s preview" : "Story"}
            status={status}
            position={state.position}
            duration={state.duration}
            attribution={state.attribution}
            hasPrevious={state.index > 0}
            hasNext={state.index < state.queue.length - 1}
            onToggle={state.toggle}
            onSeek={state.seek}
            onPrevious={state.previous}
            onNext={state.next}
            onClose={state.close}
          />
        </>
      ) : null}
    </>
  );
}

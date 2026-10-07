"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_SECONDS, pickRecorderMime } from "./audio";

export type RecorderStatus = "idle" | "requesting" | "denied" | "unsupported" | "recording" | "paused" | "done";

/** Records the microphone with MediaRecorder (Opus/WebM, or AAC on Safari), max 5 minutes. */
export function useRecorder({ onFinished }: { onFinished: (blob: Blob, mime: string) => void }) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const discard = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const meter = useRef<number | null>(null);
  const finished = useRef(onFinished);
  useEffect(() => {
    finished.current = onFinished;
  }, [onFinished]);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (meter.current) cancelAnimationFrame(meter.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    const mime = pickRecorderMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch {
      setStatus("denied");
      return;
    }
    chunks.current = [];
    const rec = new MediaRecorder(stream.current, { mimeType: mime, audioBitsPerSecond: 48_000 });
    recorder.current = rec;
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    discard.current = false;
    rec.onstop = () => {
      cleanup();
      if (discard.current) return;
      setStatus("done");
      finished.current(new Blob(chunks.current, { type: mime.split(";")[0] }), mime.split(";")[0]);
    };
    rec.start(1000);
    setElapsed(0);
    setStatus("recording");

    const started = Date.now();
    let pausedFor = 0;
    let pausedAt = 0;
    timer.current = setInterval(() => {
      if (rec.state === "paused") {
        if (!pausedAt) pausedAt = Date.now();
        return;
      }
      if (pausedAt) {
        pausedFor += Date.now() - pausedAt;
        pausedAt = 0;
      }
      const s = Math.floor((Date.now() - started - pausedFor) / 1000);
      setElapsed(s);
      if (s >= MAX_SECONDS) rec.stop();
    }, 250);

    // Input level meter (so people can see the microphone works).
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream.current).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
      setLevel(peak);
      if (stream.current) meter.current = requestAnimationFrame(tick);
      else void ctx.close();
    };
    tick();
  }, [cleanup]);

  const pause = useCallback(() => {
    if (recorder.current?.state === "recording") {
      recorder.current.pause();
      setStatus("paused");
    }
  }, []);
  const resume = useCallback(() => {
    if (recorder.current?.state === "paused") {
      recorder.current.resume();
      setStatus("recording");
    }
  }, []);
  const reset = useCallback(() => {
    discard.current = true;
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    cleanup();
    setElapsed(0);
    setStatus("idle");
  }, [cleanup]);

  return { status, elapsed, level, start, stop, pause, resume, reset };
}

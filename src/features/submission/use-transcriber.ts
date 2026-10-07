"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toWhisperInput, transcriptionDevice, type TranscriptionDevice } from "./audio";
import type { WorkerMessage } from "./whisper.worker";

export type TranscriberState =
  | { status: "checking" }
  | { status: "unavailable" }
  | { status: "available"; device: TranscriptionDevice }
  | { status: "downloading"; progress: number; device: TranscriptionDevice }
  | { status: "transcribing"; text: string; device: TranscriptionDevice }
  | { status: "done"; text: string }
  | { status: "error"; message: string };

/** Runs Whisper in a Web Worker so the page stays responsive. */
export function useTranscriber({ onDone }: { onDone?: (text: string) => void } = {}) {
  const [state, setState] = useState<TranscriberState>({ status: "checking" });
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    let cancelled = false;
    transcriptionDevice().then((device) => {
      if (!cancelled) setState(device ? { status: "available", device } : { status: "unavailable" });
    });
    return () => {
      cancelled = true;
      worker.current?.terminate();
    };
  }, []);

  const transcribe = useCallback(async (blob: Blob, device: TranscriptionDevice) => {
    setState({ status: "downloading", progress: 0, device });
    let audio: Float32Array;
    try {
      audio = await toWhisperInput(blob);
    } catch {
      setState({ status: "error", message: "This recording couldn't be read for transcription." });
      return;
    }
    worker.current?.terminate();
    const w = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const m = e.data;
      if (m.type === "download") setState({ status: "downloading", progress: m.progress, device });
      else if (m.type === "ready") setState({ status: "transcribing", text: "", device });
      else if (m.type === "partial") setState({ status: "transcribing", text: m.text, device });
      else if (m.type === "done") {
        setState({ status: "done", text: m.text });
        onDoneRef.current?.(m.text);
        w.terminate();
      } else if (m.type === "error") {
        setState({ status: "error", message: m.message });
        w.terminate();
      }
    };
    w.onerror = () => setState({ status: "error", message: "Transcription stopped unexpectedly." });
    w.postMessage({ type: "transcribe", audio, device }, [audio.buffer]);
  }, []);

  const cancel = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    transcriptionDevice().then((device) => setState(device ? { status: "available", device } : { status: "unavailable" }));
  }, []);

  return { state, transcribe, cancel };
}

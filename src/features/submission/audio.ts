"use client";
/* Browser-side audio helpers for voice stories. */

export const MAX_SECONDS = 300; // 5 minutes
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
export const ACCEPTED_UPLOAD_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/mpeg", "audio/wav", "audio/x-wav"];

/** Best recording format this browser supports (Opus where possible, AAC on older Safari). */
export function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm"].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

export function extensionFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "bin";
}

async function decode(blob: Blob, sampleRate?: number): Promise<AudioBuffer> {
  const bytes = await blob.arrayBuffer();
  const ctx = new AudioContext(sampleRate ? { sampleRate } : undefined);
  try {
    return await ctx.decodeAudioData(bytes);
  } finally {
    void ctx.close();
  }
}

export interface AudioInfo {
  durationS: number;
  /** 200 values between 0 and 1, for drawing a waveform */
  peaks: number[];
}

export async function analyse(blob: Blob): Promise<AudioInfo> {
  const buffer = await decode(blob);
  const data = buffer.getChannelData(0);
  const buckets = 200;
  const size = Math.max(1, Math.floor(data.length / buckets));
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < buckets; i++) {
    let peak = 0;
    for (let j = i * size; j < Math.min((i + 1) * size, data.length); j++) peak = Math.max(peak, Math.abs(data[j]));
    peaks.push(peak);
    max = Math.max(max, peak);
  }
  return {
    durationS: Math.round(buffer.duration),
    peaks: peaks.map((p) => Math.round((max ? p / max : 0) * 100) / 100),
  };
}

/** Mono, 16 kHz samples: the input Whisper expects. */
export async function toWhisperInput(blob: Blob): Promise<Float32Array> {
  const buffer = await decode(blob);
  const offline = new OfflineAudioContext(1, Math.ceil(buffer.duration * 16000), 16000);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

export type TranscriptionDevice = "webgpu" | "wasm";

/**
 * Decides whether this device can transcribe in reasonable time.
 * null → offer "skip, the team will add the transcript".
 */
export async function transcriptionDevice(): Promise<TranscriptionDevice | null> {
  const nav = navigator as Navigator & {
    gpu?: { requestAdapter: () => Promise<unknown> };
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return null;
  try {
    if (nav.gpu && (await nav.gpu.requestAdapter())) return "webgpu";
  } catch {
    /* no WebGPU */
  }
  const cores = nav.hardwareConcurrency ?? 2;
  const memory = nav.deviceMemory ?? 4;
  return cores >= 4 && memory >= 4 ? "wasm" : null;
}

export function estimateMinutes(device: TranscriptionDevice, durationS: number): number {
  // Rough real-world speeds: WebGPU ≈ 5× faster than real time, WASM tiny ≈ 1.5×.
  const factor = device === "webgpu" ? 0.2 : 0.7;
  return Math.max(1, Math.round((durationS * factor) / 60));
}

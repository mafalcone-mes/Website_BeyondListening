import "server-only";
import { parseBuffer } from "music-metadata";
import { LIMITS } from "@/config/limits";
import { supabaseAdmin } from "@/lib/supabase/admin";

export function extensionForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "bin";
}

const AUDIO_CONTAINERS = /webm|matroska|ebml|ogg|opus|mpeg|mp3|mp4|m4a|aac|wave|wav|riff/i;

/**
 * Checks an uploaded file really is audio of an allowed size and length,
 * by reading its container (not trusting the browser's claims).
 */
export async function verifyAudioObject(
  bucket: string,
  path: string,
): Promise<{ ok: true; durationS: number | null } | { ok: false; message: string }> {
  const { data, error } = await supabaseAdmin().storage.from(bucket).download(path);
  if (error || !data) return { ok: false, message: "The recording didn't arrive. Please try again." };
  if (data.size > LIMITS.audioBytes) return { ok: false, message: "The recording is too large (20 MB maximum)." };
  try {
    const meta = await parseBuffer(new Uint8Array(await data.arrayBuffer()), { mimeType: data.type }, { duration: true });
    if (!AUDIO_CONTAINERS.test(meta.format.container ?? "") && !meta.format.codec) {
      return { ok: false, message: "That file doesn't look like an audio recording." };
    }
    const duration = meta.format.duration ? Math.round(meta.format.duration) : null;
    if (duration && duration > LIMITS.audioSeconds + 10) {
      return { ok: false, message: "The recording is longer than 5 minutes." };
    }
    return { ok: true, durationS: duration };
  } catch {
    return { ok: false, message: "That file doesn't look like an audio recording." };
  }
}

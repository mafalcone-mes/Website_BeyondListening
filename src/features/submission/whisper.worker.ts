/// <reference lib="webworker" />
/*
 * Speech-to-text inside the browser (Whisper via transformers.js).
 * The recording never leaves the device. Model files (~40–80 MB) are
 * downloaded once from Hugging Face and cached by the browser.
 */
import { pipeline, WhisperTextStreamer, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

export type WorkerRequest = { type: "transcribe"; audio: Float32Array; device: "webgpu" | "wasm" };
export type WorkerMessage =
  | { type: "download"; progress: number }
  | { type: "ready" }
  | { type: "partial"; text: string; chunksDone: number }
  | { type: "done"; text: string }
  | { type: "error"; message: string };

const post = (m: WorkerMessage) => (self as unknown as Worker).postMessage(m);

let transcriber: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function load(device: "webgpu" | "wasm") {
  if (!transcriber) {
    const files = new Map<string, { loaded: number; total: number }>();
    transcriber = pipeline(
      "automatic-speech-recognition",
      device === "webgpu" ? "onnx-community/whisper-base.en" : "onnx-community/whisper-tiny.en",
      {
        device,
        dtype: device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8",
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status === "progress" && p.file && p.total) {
            files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
            let loaded = 0;
            let total = 0;
            for (const f of files.values()) {
              loaded += f.loaded;
              total += f.total;
            }
            post({ type: "download", progress: total ? loaded / total : 0 });
          }
        },
      },
    ) as Promise<AutomaticSpeechRecognitionPipeline>;
  }
  return transcriber;
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== "transcribe") return;
  try {
    const asr = await load(event.data.device);
    post({ type: "ready" });
    let text = "";
    let chunksDone = 0;
    const tokenizer = asr.tokenizer as unknown as ConstructorParameters<typeof WhisperTextStreamer>[0];
    const streamer = new WhisperTextStreamer(tokenizer, {
      skip_prompt: true,
      callback_function: (piece: string) => {
        text += piece;
        post({ type: "partial", text, chunksDone });
      },
      on_chunk_end: () => {
        chunksDone += 1;
        text += " ";
        post({ type: "partial", text, chunksDone });
      },
    });
    const output = await asr(event.data.audio, { chunk_length_s: 30, stride_length_s: 5, streamer });
    const final = Array.isArray(output) ? output.map((o) => o.text).join(" ") : output.text;
    post({ type: "done", text: final.trim() });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

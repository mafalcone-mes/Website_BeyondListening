#!/usr/bin/env node
// Copies the ONNX runtime (used by in-browser transcription) into public/onnx/,
// so browsers load it from this site instead of a third-party CDN. Runs after npm install.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "node_modules", "onnxruntime-web", "dist");
const dest = join(root, "public", "onnx");
if (!existsSync(src)) process.exit(0);
mkdirSync(dest, { recursive: true });
for (const file of readdirSync(src).filter((f) => /^ort-wasm.*\.(wasm|mjs)$/.test(f))) {
  copyFileSync(join(src, file), join(dest, file));
}

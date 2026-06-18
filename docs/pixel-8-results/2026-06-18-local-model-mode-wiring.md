# Pixel 8a Local Model Mode Wiring - 2026-06-18

## Scope

This pass wired explicit user-facing local model modes while keeping current fallbacks safe:

- Structured extraction mode: off, local rules, or Qwen local.
- Embedding engine mode: hash local or BGE local.
- Embedding maintenance mode remains separate: automatic or manual.

## Local Gate

- `npm run build`: passed.
- `npm test`: passed, 27 files and 126 tests.
- Added settings-store regression tests for older settings defaulting to the hash engine and for persisting Qwen/BGE mode choices.

## Device Gate

- First `npm run pixel8:install-standalone` attempt failed during Metro release bundling because statically importing the BGE runtime caused Metro to parse `onnxruntime-web` from Transformers.js:
  - `Invalid call ... ort.webgpu.bundle.min.mjs ... import(/*webpackIgnore:true*/ /*@vite-ignore*/a)`
- The app initially kept BGE selectable while staying on the hash fallback. This was superseded by `docs/pixel-8-results/2026-06-18-bge-tokenizer-packaging.md`, which replaced the native Transformers.js tokenizer path and wired BGE mode back to the guarded ONNX engine factory.
- Second `npm run pixel8:install-standalone` passed. The release APK built and installed on the attached Pixel 8a.

## Remaining Device QA

- The Pixel 8a still opens to the encrypted archive unlock state from prior encryption QA, so I could not tap through Settings to verify the new model-mode controls on-device without manual unlock or approved app-data reset.
- Qwen local structured extraction still needs actual GGUF asset QA.
- BGE local embedding execution is no longer deferred behind the tokenizer/Metro packaging issue, but it still needs actual asset QA on target hardware.

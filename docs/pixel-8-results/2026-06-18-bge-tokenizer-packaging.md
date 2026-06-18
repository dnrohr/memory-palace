# Pixel 8a BGE Tokenizer Packaging - 2026-06-18

## Scope

This pass removed the native BGE runtime dependency on Transformers.js:

- Added a bundled WordPiece tokenizer that reads the standard BGE `tokenizer.json` vocabulary.
- Wired BGE mode back to the guarded local ONNX engine factory.
- Kept hash embeddings as the fallback when assets are missing or runtime loading fails.
- Removed the unused `@huggingface/transformers` package, which also removes the transitive `onnxruntime-web` dependency that broke Metro release bundling.

## Local Gate

- `npm run build`: passed.
- `npm test`: passed, 27 files and 127 tests.
- `git diff --check`: passed.

## Device Gate

- `npm run pixel8:install-standalone`: passed.
- The Android release bundle completed without the prior `onnxruntime-web/dist/ort.webgpu.bundle.min.mjs` dynamic-import parse failure.
- The release APK installed successfully on the attached Pixel 8a.

## Remaining Device QA

- BGE still needs actual `model.onnx`, `tokenizer.json`, and `tokenizer_config.json` asset QA on target hardware.
- The Pixel 8a still opens to the encrypted archive unlock state from prior encryption QA, so Settings tap-through and embedding rebuild/search behavior with real BGE assets remain blocked without manual unlock or approved app-data reset.

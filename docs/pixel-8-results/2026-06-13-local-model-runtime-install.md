# Pixel 8a Device QA Result

## Build Under Test

- Commit: 137b843
- Date/time: 2026-06-13 19:56 -04:00
- Tester: Codex
- Pixel 8a Android version: Pixel 8a, Android 16 / API 36
- Development build install date/time: 2026-06-13 19:56 -04:00
- Connection mode: USB

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- Direct Android debug assemble: pass
- Notes: `onnxruntime-react-native@1.24.3`, `llama.rn@0.12.4`, and the tracked ONNX Gradle compatibility patch were included in the native build.

## Device Gate

- APK install on attached Pixel 8a: pass
- App launches without a red error screen: not tested in this pass
- Explore screen renders and remains responsive: not tested in this pass
- Local model runtime initialization: not tested; model assets are not wired yet
- BGE embedding rebuild/search: not tested; model assets and tokenizer are not wired yet
- Qwen structured extraction: not tested; model assets and runtime initialization are not wired yet

## Failures Or Deferrals

- Failed checklist items: none for assemble/install.
- Deferred device-QA items and reason: the available Pixel 8a is the target device, but full app workflow testing and local model runtime QA remain deferred until model assets are wired and the development-client connection or standalone model workflow can complete reliably.
- Follow-up issue or roadmap item: run Pixel 8a model-load, embedding rebuild, semantic search, structured extraction, memory/latency, fallback, and startup QA after asset loading is implemented.

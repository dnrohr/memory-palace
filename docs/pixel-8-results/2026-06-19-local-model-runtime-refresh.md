# Pixel 8a Local Model Runtime Refresh

## Build Under Test

- Commit: `ed315f8`
- Date/time: 2026-06-19 19:50 -04:00
- Tester: Codex
- Device: Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- App package: `com.anonymous.memorypalace`
- Install type: existing standalone release APK from the earlier 2026-06-19 install

## Local Gate

- `npm run verify`: pass, from the baseline/search/CRUD checkpoint earlier in this session.
- `npm run pixel8:preflight`: pass, from the same checkpoint.
- `npm run pixel8:install-standalone`: pass, from the same checkpoint.
- `npm run pixel8:local-model-qa -- --skip-install`: pass.

## Device Runtime Check

- Settings privacy summary showed:
  - Suggestions: `Qwen local`
  - Nearby search: `BGE local`
- Settings Local Processing section showed:
  - Structured extraction mode: `Qwen local`
  - Qwen readiness: `Ready in models/qwen2.5-0.5b-instruct.`
  - Embedding engine mode: `BGE local`
  - BGE readiness: `Files are present in models/bge-small-en-v1.5. BGE will use the local ONNX engine when runtime loading succeeds; hash fallback remains available.`
- `Test Qwen`: pass, `7698 ms`, `1` date, `3` tags, `0` tone labels.
- `Test BGE`: pass, `488 ms`, `384` dimensions, vector norm `1.000`.
- App stayed responsive after both probes.

## Log Check

- App-process log slice after the diagnostics had no matching fatal exception, React Native error, out-of-memory, or low-memory line.

## Deferrals

- This was a non-destructive runtime refresh. It did not clear Android app data.
- Document-picker recovery after app-data clear remains open.
- Golden-memory Qwen tag-quality review remains open.
- BGE embedding rebuild, semantic ranking, and natural-language query latency remain open.

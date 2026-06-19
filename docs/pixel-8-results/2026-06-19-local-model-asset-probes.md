# Pixel 8a Local Model Asset Probes - 2026-06-19

## Scope

Validate that the production local-model runtimes can load real model artifacts from app document storage in the standalone Android app.

## Device

- Device: Pixel 8a
- App: standalone release APK installed with `npm run pixel8:install-standalone`

## Artifact Sources

- Qwen: `Qwen/Qwen2.5-0.5B-Instruct-GGUF`
- BGE: `BAAI/bge-small-en-v1.5`

Artifacts were downloaded outside the repository to `C:\Users\dnroh\Documents\memory-palace-downloads` and copied into the app sandbox under `files/models/...`.

## Artifact Checks

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `qwen2.5-0.5b-instruct/qwen2.5-0.5b-instruct-q4_k_m.gguf` | 491400032 | `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db` |
| `bge-small-en-v1.5/model.onnx` | 133093490 | `828e1496d7fabb79cfa4dcd84fa38625c0d3d21da474a00f08db0f559940cf35` |
| `bge-small-en-v1.5/tokenizer.json` | 711396 | `d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66` |
| `bge-small-en-v1.5/tokenizer_config.json` | 366 | `9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3` |
| `bge-small-en-v1.5/special_tokens_map.json` | 125 | `b6d346be366a7d1d48332dbc9fdf3bf8960b5d879522b7799ddba59e76237ee3` |

## Runtime Fixes

- Explicitly wired `onnxruntime-react-native` into the Android project and registered `OnnxruntimePackage`.
- Removed the package's Expo unimodule marker through the tracked `patch-package` patch so Expo autolinking does not skip the native module.
- Converted BGE ONNX feeds to native `int64` tensors before calling ONNX Runtime.
- Hardened Qwen structured-extraction validation to normalize loose local-model JSON, including string tags and string/date-like date candidates.

## Results

| Diagnostic | Result |
| --- | --- |
| `Test BGE` | Passed in 539 ms with 384 dimensions and vector norm 1.000. |
| `Test Qwen` | Passed in 5303 ms with 0 date suggestions, 5 tag suggestions, and 0 tone labels. |

## Verification

- `npm run build`
- `npm test`
- `npm run pixel8:install-standalone`
- Pixel 8a Settings diagnostics for `Test BGE` and `Test Qwen`

## Remaining QA

- Run repeated local-model probes and watch memory/latency behavior.
- Exercise BGE through full embedding rebuild and semantic search flows.
- Tune Qwen prompt/grammar/output quality before making it the default structured-extraction path.
- Verify fallback and recovery behavior after missing, corrupt, or incompatible model files.

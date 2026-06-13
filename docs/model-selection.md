# Local Model Selection

Last updated: 2026-06-13

## Embeddings

Production target: `BAAI/bge-small-en-v1.5`

- Runtime target: ONNX Runtime on native mobile, Transformers.js/ONNX-compatible loading on web.
- Dimensions: 384
- Purpose: semantic search, nearby memories, related-memory drift, and future clustering.
- Current fallback: deterministic local hash embeddings.
- Integration posture: BGE-specific adapter code is present in the portable core and keeps query and passage inputs distinct. Model weights are not bundled in the repository.

Remaining work:

- Add native/web model asset loading and tokenizer wiring.
- Run Pixel 8 device QA for model load, embedding rebuild, semantic search latency, memory use, and fallback behavior.

## Structured Extraction

Production target: `Qwen2.5-0.5B-Instruct` via a local llama.cpp-compatible runtime such as `llama.rn`.

- Purpose: optional, user-confirmed title/date/tag/context suggestions beyond the rules engine.
- Current fallback: rules-based structured extraction.
- Integration posture: JSON-speaking structured extraction adapter and Qwen/llama runtime adapter are present; model weights are not bundled in the repository and the runtime should not be required at startup.

Remaining work:

- Add native model asset loading and runtime initialization.
- Keep rules as the default until device QA confirms acceptable latency, memory use, and recovery behavior.

## Sync

Production target: WebDAV encrypted sync first.

- Purpose: encrypted user-controlled backup/sync without app-owned cloud storage.
- Current status: WebDAV provider, Settings controls, and encrypted archive transport are present.

Remaining work:

- Device QA for WebDAV credentials, passphrase-gated sync, restart behavior, and conflict reporting.

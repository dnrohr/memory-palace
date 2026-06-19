# Local Model Selection

Last updated: 2026-06-19

## Embeddings

Production target: `BAAI/bge-small-en-v1.5`

- Runtime target: ONNX Runtime on native mobile, with tokenizer-json WordPiece parsing in the app bundle.
- Dimensions: 384
- Purpose: semantic search, nearby memories, related-memory drift, and future clustering.
- Current fallback: deterministic local hash embeddings.
- Integration posture: BGE-specific adapter code is present in the portable core and keeps query and passage inputs distinct. A checked asset manifest and factory require `model.onnx`, `tokenizer.json`, and `tokenizer_config.json` before creating the BGE engine. The Expo app checks for these files under `models/bge-small-en-v1.5` in app document storage, maps the ONNX file into ONNX Runtime, and reads the local `tokenizer.json` with a bundled WordPiece tokenizer so native Metro builds do not pull `onnxruntime-web`. Model weights are not bundled in the repository.
- Runtime verification: Settings includes a `Test BGE` diagnostic that reports exact missing required files and, when assets are present, loads the production ONNX Runtime path, embeds a small probe phrase, and reports elapsed time, vector dimensions, and vector norm.

Remaining work:

- Run Pixel 8a device QA with actual ONNX/tokenizer assets for model load, embedding rebuild, semantic search latency, memory use, and fallback behavior.

## Structured Extraction

Production target: `Qwen2.5-0.5B-Instruct` via a local llama.cpp-compatible runtime such as `llama.rn`.

- Purpose: optional, user-confirmed title/date/tag/context suggestions beyond the rules engine.
- Current fallback: rules-based structured extraction.
- Integration posture: JSON-speaking structured extraction adapter and Qwen/llama runtime adapter are present. A checked asset manifest and factory require the quantized GGUF file before creating the Qwen engine, with optional grammar support. The Expo app checks for these files under `models/qwen2.5-0.5b-instruct` in app document storage and has a native `llama.rn` loader that initializes a context from the resolved GGUF URI when Qwen local mode is selected. Model weights are not bundled in the repository and the runtime is not required at startup.
- Runtime verification: Settings includes a `Test Qwen` diagnostic that checks the document-storage asset directory, reports exact missing required files, and, when assets are present, loads the production `llama.rn` runtime and runs a small structured-extraction probe with elapsed-time and output-count feedback.

Remaining work:

- Keep rules as the default until Pixel 8a QA with actual GGUF assets confirms acceptable latency, memory use, and recovery behavior.

## Sync

Production target: WebDAV encrypted sync first.

- Purpose: encrypted user-controlled backup/sync without app-owned cloud storage.
- Current status: WebDAV provider, Settings controls, encrypted archive transport, and Pixel 8a loopback first-push QA are present.

Remaining work:

- Broader provider QA for non-loopback WebDAV servers, credential failure handling, restart behavior, and conflict reporting.

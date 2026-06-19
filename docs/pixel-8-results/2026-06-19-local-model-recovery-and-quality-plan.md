# Pixel 8 Local Model Recovery And Quality Plan

Date: 2026-06-19

Device target: Pixel 8 / Pixel 8a via ADB

Android package: `com.anonymous.memorypalace`

External artifact folder: `C:\Users\dnroh\Documents\memory-palace-downloads`

## Purpose

Prove the user-facing local model flows work after Android app data is cleared. This plan is broader than checking that files exist: it verifies explicit recovery through the document picker, Qwen hybrid tag quality, BGE semantic search behavior, fallback behavior, and practical latency.

## Asset Recovery Checklist

- Start from the standalone APK for the current commit.
- Run `npm run pixel8:local-model-qa` first without `--clear-app-data`.
- Only after explicit approval, run `npm run pixel8:local-model-qa -- --clear-app-data`.
- Confirm Settings reports missing Qwen and BGE assets after app-data clear.
- Use Settings -> Import local model files.
- Select these files from `C:\Users\dnroh\Documents\memory-palace-downloads`:
  - `qwen2.5-0.5b-instruct-q4_k_m.gguf`
  - `model.onnx`
  - `tokenizer.json`
  - `tokenizer_config.json`
  - `special_tokens_map.json` if present
  - `structured-extraction.gbnf` if present
- Confirm unrecognized files are reported as ignored, not silently treated as imported.
- Confirm required files with wrong byte sizes are rejected by readiness checks.
- Confirm optional files can be absent without blocking readiness.
- Confirm Qwen readiness and BGE readiness are reported independently.

## Runtime Smoke Checklist

- Launch the app after import and navigate to Settings.
- Select Qwen local structured extraction mode.
- Run `Test Qwen`; record elapsed time, date count, tag count, tone count, and any error text.
- Select BGE local embedding mode.
- Run `Test BGE`; record elapsed time, vector dimension count, and vector norm.
- Force-stop and relaunch the app; confirm imported model readiness survives normal restart.
- Clear app data only with approval; confirm readiness disappears and can be recovered through explicit import.
- Return modes to defaults when the QA run is complete unless the run intentionally leaves local models enabled.

## Tag-Quality Golden Cases

Use new typed memories so Qwen suggestions are judged in the actual save/review flow, not only through the Settings probe.

| Case | Memory text | Expected rules baseline | Qwen may add | Must filter |
| --- | --- | --- | --- | --- |
| Family/place/year | `In 2004 I visited Grandma in Queens and we walked past the old apartment.` | `family`, `Grandma`, `Queens`, `apartment`, date `2004` | `old apartment`, `walking` only if useful | `I`, `visited`, `2004` as a tag |
| Pet/home/grief | `My dog Patrick slept by the sunny window at the old house after the vet visit.` | `dog`, `pet`, `Patrick`, `old house`, `home`, `health` | `vet`, `window` | `my`, `slept` |
| Work/friend | `Maya and I worked late after college, then ate noodles near the office.` | `Maya`, `college`, `work` | `office`, `friends` if justified | `I`, `worked`, `late` |
| School/moving | `Before we moved, my sister kept every school notebook in a blue box.` | `moving`, `family`, `school` | `sister`, `notebook` | `we`, `moved`, `kept` |

Acceptance: Qwen mode must preserve the useful rules baseline. Model tags are only a quality improvement if they add explicit people, places, pets, activities, objects, life periods, or themes without adding noisy pronouns, ordinary verbs, or standalone years.

## Semantic Search Cases

Create or keep the golden memories above, then rebuild embeddings with BGE selected.

| Query | Expected top result | Secondary expectation |
| --- | --- | --- |
| `grandma queens apartment` | Family/place/year case | Should beat pet/home and work cases |
| `dog sunny window vet` | Pet/home/grief case | Should surface `Patrick` memory above unrelated work/school cases |
| `college office noodles` | Work/friend case | Should keep `Maya` work memory near the top |
| `school notebooks moving` | School/moving case | Should rank the moving/school memory first |

Record whether result ordering is meaningfully better than hash fallback for these natural-language queries.

## Failure And Recovery Cases

- Missing Qwen GGUF: Qwen mode falls back to rules and still suggests baseline tags.
- Missing BGE ONNX: BGE mode falls back to hash embeddings and search remains usable.
- BGE ready while Qwen missing: semantic search readiness is not blocked by Qwen.
- Qwen ready while BGE missing: structured extraction readiness is not blocked by BGE.
- Wrong-size required file: readiness rejects the model and reports the affected filename.
- Wrong file selected: import reports the filename as ignored.
- App-data clear: sandboxed model files disappear; recovery requires explicit user import.
- Repeated probe run: no crash or permanent mode corruption after two Qwen probes and two BGE probes.

## Performance Measurements To Record

- APK commit hash and build date.
- Device model, Android version, and whether the 16 KB native-library compatibility warning appeared.
- Qwen import time as observed by the user.
- Qwen first probe latency and second probe latency.
- Qwen save/review suggestion latency for each golden memory.
- BGE import time as observed by the user.
- BGE first probe latency, second probe latency, vector dimensions, and vector norm.
- Embedding rebuild time for the golden memory set.
- Semantic query latency for each query.
- Any visible app stalls, crashes, Android low-memory warnings, or Settings error text.

## Acceptance Criteria

- `npm run build`, `npm test`, and `git diff --check` pass for the QA harness changes.
- `npm run pixel8:local-model-qa` runs without clearing app data by default.
- App data is cleared only when `--clear-app-data` is explicitly passed and approved.
- After approved app-data clear, Settings shows missing local model files before import.
- Document-picker import restores Qwen and BGE readiness using artifacts outside the repo.
- Qwen mode preserves rules tags in the golden cases and filters noisy pronoun, verb, and standalone-year tags.
- Missing or invalid Qwen assets fall back to rules without blocking save/review.
- BGE readiness and Qwen readiness are independent.
- Missing or invalid BGE assets fall back to hash search without blocking search.
- BGE semantic search ranks the expected golden memories first for at least three of four semantic queries and records any miss honestly.
- Manual Pixel verification is recorded in a follow-up result doc before this flow is marked complete.

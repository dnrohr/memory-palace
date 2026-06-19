# Pixel 8a Local Model Runtime Probes

Date: 2026-06-19

Device: Pixel 8a, Android 16

Android package: `com.anonymous.memorypalace`

Build under test: `23de50c`

Connection mode: USB / ADB

## Scope

Targeted device QA for the production local model runtimes listed in the roadmap:

- Qwen2.5-0.5B-Instruct through `llama.rn`
- BAAI/bge-small-en-v1.5 through `onnxruntime-react-native`

This pass did not clear app data. The device already had model assets imported and Settings reported both manifests as ready.

## Device Setup

- `npm run pixel8:preflight`: pass
- `npm run pixel8:local-model-qa -- --skip-install`: pass
- ADB device: `47091JEKB05516`
- Settings model readiness:
  - BGE small English v1.5: `ready in models/bge-small-en-v1.5`
  - Qwen2.5 0.5B Instruct: `ready in models/qwen2.5-0.5b-instruct`

The helper's non-debuggable sandbox file probe was not authoritative for this standalone build; Settings used the app's native file-system view and reported both manifests ready.

## Runtime Probe Results

- BGE probe: passed in `419 ms`
  - Dimensions: `384`
  - Vector norm: `1.000`
- Qwen probe, first run: passed in `7824 ms`
  - Dates: `1`
  - Tags: `3`
  - Tone labels: `0`
- Qwen probe, second run: passed in `7219 ms`
  - Dates: `1`
  - Tags: `3`
  - Tone labels: `0`

## Additional Checks

- New-memory typed editor opened successfully and exposed the Qwen `Format transcript` action.
- App stayed responsive after Qwen and BGE probes.
- Recent app-specific log slice after the probes showed no `FATAL EXCEPTION`, `AndroidRuntime`, or out-of-memory lines.

## Not Completed In This Pass

- App-data-clear recovery through the Android document picker was not rerun.
- The full golden-memory Qwen quality table was started but not accepted as complete because ADB text entry and partial UI dumps did not provide reliable saved-memory/result verification.
- BGE semantic ranking for the four golden search cases was not accepted as complete for the same reason.
- Non-loopback WebDAV provider and sync-conflict QA were not part of this runtime probe pass.

## Result

The actual model runtimes loaded and produced successful on-device diagnostics on the Pixel 8a. Broader recovery, output-quality, semantic-ranking, and non-loopback sync QA remain open until they can be verified with reliable saved-content and search-result evidence.

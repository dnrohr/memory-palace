# Pixel 8a Baseline, Search, And CRUD QA

## Build Under Test

- Commit: `059e85c`
- Date/time: 2026-06-19 19:37 -04:00
- Tester: Codex
- Pixel 8a Android version: 16
- Install type: standalone release APK
- Connection mode: USB / ADB
- Device serial: `47091JEKB05516`

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- `npm run pixel8:install-standalone`: pass

## Device Gate

- App launches without a red error screen: pass
- New Memory launch screen renders without focusing the typed field by default: pass
- Existing typed draft saved successfully: pass
- Save returned to Explore with `Memory saved.` feedback: pass
- Force-stop and relaunch completed; Explore showed the saved memory after tapping the Explore tab: pass
- Open memory detail: pass
- Edit memory metadata and confirm persistence: pass
  - Added manual tag `baselineqa`.
  - Detail screen immediately rendered the saved tag.
- Search saved memory text: pass
  - Typed `Queens` into the Explore search field.
  - Keyboard resized the app, kept the focused search field visible, and showed a matching text suggestion.
- Settings sections render: pass
  - Privacy/local state, Appearance, Life Calendar, local model state, and export/import sections were visible through accessibility dumps.
- Soft-delete test memory: not run in this pass; prior deleted-memory restore/permanent-delete evidence remains in roadmap history, and this run kept the baseline record available for search/persistence checks.
- JSON export: not rerun in this pass; Android share chooser export evidence is recorded in `docs/pixel-8-results/2026-06-18-share-import-model-controls.md`.
- Markdown export: not rerun in this pass; Android share chooser export evidence is recorded in `docs/pixel-8-results/2026-06-18-share-import-model-controls.md`.
- Archive/encryption flow: not applicable for this baseline pass.
- App lock flow: not applicable for this baseline pass.
- Voice capture flow: not tested; Milestone 3 remains open.

## Permission Prompts

- Microphone: not requested.
- Speech recognition: not requested.
- Files/documents: not requested.
- Biometrics: not requested.

## Log Check

- App-process log slice for the running `com.anonymous.memorypalace` process showed normal `ReactNativeJS` startup only.
- No app-process fatal exception, React Native error, or visible red screen was observed during the run.

## Roadmap Result

- Milestone 1 Pixel 8a baseline device QA is now covered for launch, save, persistence, detail navigation, metadata edit, Settings render, and app-process error check.
- Milestone 2 Pixel 8a search and keyboard QA is now covered for focused search input, keyboard resize behavior, text suggestion visibility, and a saved-memory result for `Queens`.
- Milestone 3 remains open for audible Android transcription, long-pause behavior, hold-to-speak, interruption recovery, and cross-platform speech permission flows.

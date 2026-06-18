# Pixel 8a Share, Import, and Model Controls Follow-up - 2026-06-18

## Scope

This pass used the standalone APK on the attached Pixel 8a after the prior encrypted-archive startup blocker cleared without clearing app data.

## Local Gate

- `npm run build`: passed.
- `npm test`: passed, 27 files and 127 tests.
- `git diff --check`: passed.

## Device Gate

- `npm run pixel8:preflight`: passed.
- `npm run pixel8:install-standalone`: passed.
- App launch: passed. The app opened into New memory instead of the prior encrypted archive unlock screen.
- Settings visibility: passed. Settings opened from the app shell and rendered trust, storage, local processing, security, sync, export, and import sections.
- Local model controls: passed for missing-asset fallback visibility. Qwen local mode and BGE local mode could be selected on-device, each reported its missing model assets and fallback state, and both were restored to the defaults (`local rules` and `hash local`).
- JSON export share handoff: passed. Android's chooser took foreground with `memory-palace-export.json`.
- Markdown export share handoff: passed. Android's chooser took foreground with `memory-palace-markdown-2026-06-18.md`.
- Markdown bundle export share handoff: passed. Android's chooser took foreground with `memory-palace-markdown-bundle-2026-06-18.txt`.
- SQLite SQL export share handoff: passed. Android's chooser took foreground with `memory-palace-export.sql`.
- Import handoff: passed. The Android document picker took foreground from the app's Import action.
- JSON import preview/apply: passed. A one-memory JSON archive was pushed to Android Downloads, selected from the document picker, previewed as `1 new memories, 0 duplicates, 1 new tags`, applied, and then appeared in Explore as `Revisit "Pixel 8a import QA memory"`. The temporary picker artifact was removed from Downloads afterward.
- Import error handling: passed for malformed leading bytes. The first artifact was written with a UTF-8 BOM and the app showed `JSON Parse error: Unexpected character: ï»¿`; replacing it with no-BOM UTF-8 allowed preview/apply.
- Markdown import preview/apply: passed. A one-memory Markdown artifact with front matter was pushed to Android Downloads, selected from the document picker, previewed as `1 new memories, 0 duplicates, 1 new tags`, applied, and then appeared in Explore as `Revisit "Pixel 8a Markdown import QA memory"`. The temporary picker artifact was removed from Downloads afterward.
- PIN app-lock smoke: passed. Settings Security started at `Mode: disabled`; saving temporary PIN `4242` presented the app lock screen, unlocking with the same PIN returned to the app, and `Disable lock` restored `Mode: disabled` before ending the run.

## Remaining Device QA

- Biometric app-lock enable, lock, unlock, and disable still need device QA.
- WebDAV sync still needs a configured test server.
- Qwen and BGE still need actual model-asset QA on target hardware.

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

## Remaining Device QA

- Import preview/apply still needs a real JSON or Markdown artifact selection.
- App lock PIN/biometric enable, lock, unlock, and disable still need device QA.
- Archive-at-rest migration and restart unlock still need a fresh passphrase migration pass.
- WebDAV sync still needs a configured test server.
- Qwen and BGE still need actual model-asset QA on target hardware.

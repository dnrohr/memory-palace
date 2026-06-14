# Pixel 8a Device QA Result - Standalone Major-Gate Smoke

## Build Under Test

- Commit: `8fc9dfc`
- Date/time: 2026-06-14 00:13-00:18 America/New_York
- Tester: Codex
- Device: Pixel 8a
- Android version: 16
- Install type: standalone release APK installed with `npm run pixel8:install-standalone`
- Connection mode: USB for ADB automation; app runtime did not use Metro
- Screenshots:
  - `docs/pixel-8-results/2026-06-14-standalone-install-launch.png`
  - `docs/pixel-8-results/2026-06-14-major-gate-settings.png`

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- Notes: preflight found one ADB-ready Android device.

## Device Gate

- App launches without a red error screen: pass
- Explore screen renders and remains responsive: pass
- Create and save a text memory: pass
- Reopen app and confirm saved memory loads: pass
- Open memory detail: pass
- Search saved memory text: pass
- Review suggestions or metadata actions: partial; the post-save suggestion panel rendered and offered a suggested tag.
- Settings sections render: pass for visible Privacy, Appearance, Storage, Local Processing, local model asset fallback, and diagnostics surfaces.
- Export/import surfaces: pass for presence through UIAutomator evidence; offscreen nodes included `Export archive`, `JSON`, `Markdown`, `Markdown bundle`, `SQLite SQL`, and `Import`.
- Local model fallback visibility: pass; BGE and Qwen asset panels showed missing required files and fallback status.
- Recent fatal logcat check: pass; no `FATAL EXCEPTION` was present in the final captured window.

## Not Tested In This Pass

- Edit memory and confirm persistence.
- Soft-delete test memory.
- Trigger JSON, Markdown, Markdown bundle, SQLite SQL, or import actions.
- Archive/encryption migration, unlock, and plaintext cleanup.
- App lock PIN or biometric flows.
- Voice capture permission, recording, transcription, and fallback.
- WebDAV sync action.
- Device QA with actual local model assets.

## Failures Or Deferrals

- The connected `Pixel 8a` is the target Android device; remaining work is workflow-specific rather than hardware-model-specific.
- This pass used ADB coordinate/UIAutomator smoke testing, so workflows that require file pickers, share sheets, biometric prompts, or speech permissions remain open.

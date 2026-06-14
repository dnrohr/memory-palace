# Pixel 8 Device QA Result - Standalone Install Launch

## Build Under Test

- Commit: working tree before documentation/install-helper commit
- Date/time: 2026-06-14 00:10-00:13 America/New_York
- Tester: Codex
- Device: Pixel 8a
- Android version: 16
- Install date/time: 2026-06-14 00:10:20
- Connection mode: USB for install, standalone app launch after install
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- Screenshot: `docs/pixel-8-results/2026-06-14-standalone-install-launch.png`

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- Notes: preflight found `adb` at `C:\Users\dnroh\AppData\Local\Android\Sdk\platform-tools\adb.exe`, Java at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot\`, and one ADB-visible Android device.

## Device Gate

- `npm run pixel8:install-standalone`: pass after first release build completed slowly; APK installed on the connected device.
- App package present after install: pass
- App launches without a red error screen: pass
- Explore screen renders: pass
- App launches into standalone UI without Metro/development launcher: pass
- Recent logcat fatal exception check: pass; no `FATAL EXCEPTION` was present in the captured launch window.

## Not Tested In This Pass

- Create and save a text memory.
- Reopen app and confirm saved memory loads.
- Search saved memory text.
- JSON and Markdown export.
- Settings sections.
- Archive/encryption, app lock, voice capture, WebDAV sync, and model-asset flows.

## Failures Or Deferrals

- Exact Pixel 8 hardware was not attached; the connected device reported `Pixel 8a`.
- This was a launch/install validation for the new standalone testing path, not the full major-change device checklist.

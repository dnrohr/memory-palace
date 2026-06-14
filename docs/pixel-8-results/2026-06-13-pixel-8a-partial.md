# Pixel 8a Device QA Result

## Build Under Test

- Commit: 089870b plus local preflight/build-script changes
- Date/time: 2026-06-13 09:16-09:45 America/New_York
- Tester: Codex automation with ADB
- Device: Pixel 8a
- Android version: 16
- Development build install date/time: 2026-06-13 09:23
- Connection mode: USB with `adb reverse tcp:8081 tcp:8081`

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- Notes: Preflight found `adb` at `C:\Users\dnroh\AppData\Local\Android\Sdk\platform-tools\adb.exe`, found Java at `C:\Program Files\Android\Android Studio\jbr`, and saw one ADB-ready Android device.

## Device Gate

- Build/install development build: pass
- App launches without a red error screen: pass
- Explore screen renders and remains responsive: pass
- Create and save a text memory: pass
- Reopen app and confirm saved memory loads: partial pass; after force-stop the dev client returned to its launcher, then reconnecting to `exp://127.0.0.1:8081` loaded Explore and showed the saved smoke memory in the Continue panel.
- Open memory detail: pass; save flow landed on the memory detail screen.
- Search saved memory text: partial; search field focused and Android keyboard accepted a query, but result verification was interrupted when the device locked.
- Settings sections render: pass.
- JSON export: not tested.
- Markdown export: not tested.
- Review suggestions or metadata actions: not tested.
- Soft-delete test memory: not tested.
- Archive/encryption flow, if affected: not tested.
- App lock flow, if affected: not tested.
- Voice capture flow, if affected: not tested.

## Permission Prompts

- Microphone: not tested.
- Speech recognition: not tested.
- Files/documents: not tested.
- Biometrics: not tested.

## Failures Or Deferrals

- Red screens, visible errors, or console errors: none observed on the tested Explore, save/detail, reconnect, and Settings surfaces.
- Notable logcat entry: dev launcher reports `ClassNotFoundException: expo.modules.splashscreen.SplashScreenManager`; app surfaces still loaded after connecting to Metro.
- Failed checklist items: none in the tested subset.
- Deferred device-QA items and reason: search result verification, export/import, app lock, encryption, voice capture, delete/restore, and the full checklist remain to be run on the target Pixel 8a by a human or unlocked interactive device session.
- Follow-up roadmap item: run the full `PIXEL_8_TEST.md` checklist on the target physical Pixel 8a and record complete pass/fail evidence.

# Pixel 8a Device QA Result

## Build Under Test

- Commit: 0951e94
- Date/time: 2026-06-13 19:07 -04:00
- Tester: Codex
- Pixel 8a Android version: Pixel 8a, Android 16 / API 36
- Development build install date/time: 2026-06-13 18:57 -04:00
- Connection mode: USB reverse to local Metro

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- Notes: ADB was discovered at `C:\Users\dnroh\AppData\Local\Android\Sdk\platform-tools\adb.exe`; Java was discovered at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot\`; one ADB-ready Pixel 8a was visible.

## Device Gate

- App launches without a red error screen: partial
- Explore screen renders and remains responsive: not tested
- Create and save a text memory: not tested
- Reopen app and confirm saved memory loads: not tested
- Open memory detail: not tested
- Edit memory and confirm persistence: not tested
- Search saved memory text: not tested
- Review suggestions or metadata actions: not tested
- Soft-delete test memory: not tested
- JSON export: not tested
- Markdown export: not tested
- Settings sections render: not tested
- Archive/encryption flow, if affected: not tested
- App lock flow, if affected: not tested
- Voice capture flow, if affected: not tested

## Permission Prompts

- Microphone: not tested
- Speech recognition: not tested
- Files/documents: not tested
- Biometrics: not tested

## Failures Or Deferrals

- Red screens, visible errors, or console errors: no Android runtime crash was observed in the filtered logcat slice; the Expo development launcher displayed `unexpected end of stream on http://127.0.0.1:8081/...` after selecting the recent local server.
- Failed checklist items: full app UI workflow testing could not proceed because the development client did not complete the Metro connection from the launcher.
- Deferred device-QA items and reason: the available Pixel 8a is the target device, but startup beyond the development launcher, navigation, persistence, search, export/import, app lock, encryption, and voice capture still need a successful development-client bundle connection or standalone workflow pass.
- Follow-up issue or roadmap item: keep the current app marked as needing full target Pixel 8a workflow QA.

## Notes

- `npm run pixel8:build` was attempted first but the Expo wrapper process remained alive for more than 12 minutes with no updated APK timestamp, so the stuck process chain was stopped.
- Direct Gradle assembly succeeded with `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.
- The resulting `android\app\build\outputs\apk\debug\app-debug.apk` was installed successfully with `adb install -r`.
- Metro received Android bundle requests and completed bundling; the development launcher still reported a stream error before the Memory Palace app UI could be exercised.

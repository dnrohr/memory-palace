# Pixel 8a Standalone Workflow and Encryption QA - 2026-06-18

## Device

- Device: Pixel 8a
- Android: 16
- ADB serial: 47091JEKB05516
- App package: `com.anonymous.memorypalace`
- Build: local release APK from the working tree after commit `31eadea`

## Local Gate

- `npm run verify`: passed
- `npm test`: passed as part of verify, 26 files and 124 tests
- `npm run build`: passed as part of verify

## Install Gate

- `npm run pixel8:install-standalone`: passed
- Gradle task: `:app:assembleRelease`
- Install result: `Success`
- Build note: `llama.rn` still built CPU-only because the Hexagon SDK is not present.

## Workflow Results

- Launch: passed. The app opened to New memory after a clean launch.
- Typed capture: passed before this fix batch. A typed memory, `QA roadmap standalone June18 searchtoken`, saved successfully.
- Persistence: passed before this fix batch. After force-stop and relaunch, the saved memory was still visible from Explore.
- Keyword search: passed before this fix batch. Searching `searchtoken` showed the matching memory.
- Detail navigation: passed before this fix batch. The saved memory opened into the Memory detail screen.
- Settings visibility: passed. Settings rendered privacy, app lock, encryption, WebDAV, export, and import controls.
- Encrypted JSON export: partially passed. The export passphrase enabled the JSON action and the previous `Secure random bytes are unavailable in this runtime.` error did not return in UIAutomator output or filtered logcat. Under ADB, the Android share chooser did not visibly take focus, so share-sheet handoff still needs a manual or instrumented follow-up.
- Encrypted local backup: passed. Entering a backup passphrase and tapping `Sync encrypted backup` produced `Encrypted backup synced. Pushed 4, pulled 0.` on-device with no secure-random failure and no app fatal exception in filtered logcat.

## Bug Found And Fixed

The standalone Android runtime did not expose secure random bytes through the existing global Web Crypto path used by encrypted exports and encrypted archive backup. The app showed `Secure random bytes are unavailable in this runtime.` when attempting encrypted JSON export.

The fix adds an injectable secure-random source to `WebCryptoExportEncryptionProvider` and wires the mobile app to `expo-crypto` for `getRandomValues`. A regression test covers the injected random source when global crypto is unavailable.

## Deferred

- Android share-sheet handoff for JSON, Markdown, Markdown bundle, SQLite SQL, and import preview still needs explicit follow-up.
- Audible Android transcription, long pauses, interruption behavior, iOS speech, and accepted web speech remain open.
- Archive-at-rest migration and unlock on Pixel 8a remain open.
- App lock enable/unlock QA remains open; it was not exercised to avoid locking the QA device unexpectedly.
- WebDAV sync remains open because no test server was configured.
- Actual BGE/Qwen model-asset runtime QA remains open; the native-library page-size warning and CPU-only `llama.rn` build note still apply.
- Edit/tag persistence was not counted in this run because one ADB input attempt used shell-sensitive semicolon text.

# Google Pixel 8 Development-Build Validation

Use this checklist to run Memory Palace on a physical Google Pixel 8 with an Expo development build. This is the primary device-QA path for Android because the app uses native modules such as SQLite, SecureStore, document picking, local authentication, and speech recognition.

## Prerequisites

- Google Pixel 8 with Developer options and USB debugging enabled.
- Android platform tools available through Android Studio or the Expo Android toolchain.
- The Pixel 8 and this development machine are on the same Wi-Fi network for LAN loading, or USB is connected for the build/install step.
- Node.js 22 or newer and npm are installed.
- Repository dependencies are installed:

```bash
npm install
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Build Or Install The Development Client

Before building, confirm this machine can see the phone:

```bash
npm run pixel8:preflight
```

This checks the local Pixel 8 QA scripts/docs and verifies that `adb devices` reports at least one connected Android device.

Install a development build on the Pixel 8:

```bash
npm run pixel8:build
```

This runs `expo run:android --device`, builds the native Android app with `expo-dev-client`, and installs it on the selected connected device.

Use this whenever native dependencies, app config, Android permissions, SQLite, SecureStore, speech recognition, document picking, or biometric lock behavior changes.

## Start The App For Pixel 8 Testing

After the development build is installed, start the Metro server for the dev client:

```bash
npm run pixel8
```

This runs `expo start --dev-client --android`.

If the Pixel 8 cannot connect over LAN, start a tunnel:

```bash
npm run pixel8:tunnel
```

This runs `expo start --dev-client --tunnel`.

## Open On Pixel 8

1. Unlock the Pixel 8.
2. Open the installed Memory Palace development build.
3. If prompted, connect to the running Metro server from the development-client launcher.
4. Wait for the JavaScript bundle to finish loading.

## Expo Go Fallback

Expo Go can still be useful for quick JavaScript-only checks:

```bash
npm start
```

Use Expo Go only for flows that do not depend on native module behavior. Do not use Expo Go as evidence for SQLite persistence, SecureStore/PIN behavior, speech recognition, app lock, document picking, or Android permission behavior.

## Major-Change Gate

Before marking a major mobile-facing change complete, run:

```bash
npm run verify
```

Then run the relevant Pixel 8 development-build checks below. If Pixel 8 testing is not possible, record the reason in `ROADMAP.md` and keep the item marked as needing device QA.

Major changes include:

- Native dependency or Expo config changes.
- SQLite schema, persistence, or migration changes.
- Archive encryption, unlock, or storage cleanup changes.
- App lock, PIN, biometric, or SecureStore changes.
- Voice capture, microphone, or speech recognition changes.
- Import, export, file picker, sync, or backup changes.
- Navigation shell or major UI-flow changes.

## Validation Checklist

- App launches without a red error screen.
- Explore screen renders and remains responsive.
- Create a memory with text content.
- Save the memory and confirm it appears in the list.
- Close and reopen the development build, then confirm saved memories still load.
- Open the saved memory detail view.
- Edit the memory and confirm the update persists.
- Search for text from the saved memory.
- Add or confirm tags/metadata suggestions if available.
- Soft-delete a test memory and confirm it leaves the active list.
- Export memories as JSON.
- Export memories as Markdown.
- Open Settings and verify processing, storage, security, export/import, and diagnostics sections render.
- If testing encryption/archive-at-rest changes, enable the relevant setting, restart the app, unlock with the passphrase, and confirm plaintext storage cleanup still leaves the archive readable.
- If testing app lock changes, enable PIN or biometric lock, lock the app, unlock it, then disable lock.
- If testing voice changes:
  - Accept microphone and speech recognition permissions.
  - Record or dictate a short memory.
  - Confirm transcription appears, or that recognition failure creates an editable fallback draft.
  - Background the app during recording and confirm interruption handling is visible and recoverable.

## Record Results

Record results with `docs/pixel-8-result-template.md`. Copy the template into the implementation log, PR notes, or a dated QA result file.

At minimum, record:

- Pixel 8 Android version.
- Whether LAN, tunnel, or USB was used.
- Development build install date/time.
- Any permission prompts accepted or denied.
- Any red screen, visible error, console error, failed validation item, or deferred device-QA item.

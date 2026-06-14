# Android Archive Encryption Native QA - 2026-06-14

## Build Under Test

- Branch: `main`
- Device: Google Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- Package: `com.anonymous.memorypalace`
- Test passphrase used for attempted archive migration: `codexarchive2026`

## Local Verification

- `npx vitest run test/securitySync.test.ts`: passed, 13 tests.
- `npm run build`: passed.
- `npm run verify`: passed before the final UI placement adjustment; full suite passed with 25 test files and 119 tests.
- `npm run pixel8:install-standalone`: passed after rebuilding and installing the release APK on the attached Pixel 8a.

## What Changed

- Added a native-compatible encryption fallback for runtimes that expose `crypto.getRandomValues` but not `crypto.subtle`.
- The encrypted envelope format remains `memory-palace.encrypted.v1` with AES-GCM and PBKDF2-SHA-256.
- Added a regression test for encrypt/decrypt when secure random values are available without Web Crypto `subtle`.
- Moved the archive-scope save button above the helper copy and clear stale archive passphrases when leaving archive/user-passphrase mode.

## Device Result

- The old Android standalone build could not save archive-at-rest encryption and surfaced the unavailable-Web-Crypto path.
- The updated standalone build installed and launched successfully.
- Saving `disabled` encryption options from Settings succeeded, and the app relaunched into Explore without requiring an archive passphrase.
- Attempting to save `archive` scope with a passphrase still did not dispatch the archive save action on the Pixel 8a. The screen remained on the enabled save button and did not show the archive success message or startup unlock screen.
- Final relaunch loaded Explore, confirming the phone was not left passphrase-gated.
- Recent logcat checks showed no `FATAL EXCEPTION` during final relaunch.

## Evidence

- Disabled save success: `docs/encryption-qa-results/2026-06-14-android-archive-save-disabled.png`
- Archive save blocked state: `docs/encryption-qa-results/2026-06-14-android-archive-save-blocked.png`
- Final non-locked relaunch: `docs/encryption-qa-results/2026-06-14-android-archive-final-relaunch.png`

## Follow-Up

- Archive-at-rest Android device QA remains open.
- Next pass should instrument the Settings save action or replace the archive migration control with a simpler Android-native interaction path before treating archive-at-rest as target-device verified.
- Exact Pixel 8 hardware and iOS archive-at-rest QA remain open.

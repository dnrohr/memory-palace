# Android WebDAV Loopback QA - 2026-06-18

## Scope

This pass used the standalone APK on the attached Pixel 8a and a temporary local HTTP endpoint exposed to the device with `adb reverse tcp:8765 tcp:8765`.

## Local Gate

- `npm run build`: passed.
- `npm test -- --run test/securitySync.test.ts`: passed, 15 tests.
- `npm test`: passed, 27 files and 128 tests.
- `git diff --check`: passed.
- `npm run pixel8:preflight`: passed.
- `npm run pixel8:install-standalone`: passed after the WebDAV provider fix and again after the Android loopback network security config.

## Device Gate

- First retry after provider fix: exposed the true Android blocker. The app showed `WebDAV sync failed: fetch failed: java.net.UnknownServiceException: CLEARTEXT communication to 127.0.0.1 not permitted by network security policy` instead of the previous misleading archive-encryption settings message.
- Loopback cleartext policy: passed. The Android release manifest now points to `@xml/network_security_config`, which permits cleartext only for `localhost` and `127.0.0.1`.
- WebDAV first push: passed. With the fixed APK installed, the app synced to `http://127.0.0.1:8765/memory-palace-webdav.json` and showed `WebDAV sync complete. Pushed 3, pulled 0.`
- Server traffic: passed. The temporary server received `GET`, `GET`, `PUT`, then `GET` for `/memory-palace-webdav.json`.
- Remote record encryption: passed. The stored payload was `memory-palace.archive.encrypted.v1` and did not contain visible plaintext memory text or QA import tokens.
- Cleanup: passed. The ADB reverse mapping, local server process, temporary server files, and UIAutomator XML dumps were removed after the run.

## Code Fixes Covered

- WebDAV sync now validates encryption provider settings directly and lets transport failures surface as `webdav-sync-error` conflicts instead of masking them as archive-encryption settings conflicts.
- Android permits cleartext only for loopback hosts, enabling repeatable local WebDAV QA without allowing arbitrary cleartext remote sync.

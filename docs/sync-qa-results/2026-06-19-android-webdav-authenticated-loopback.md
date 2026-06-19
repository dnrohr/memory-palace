# Android WebDAV Authenticated Loopback QA - 2026-06-19

## Scope

This pass used the standalone APK on the attached Pixel 8a and a temporary authenticated HTTP/WebDAV-like endpoint exposed to the device with `adb reverse tcp:8767 tcp:8767`.

It broadens the earlier loopback first-push evidence by exercising credential failure, authenticated success, and plaintext-leak checks against the user-facing Settings flow. It does not cover a non-loopback provider.

## Build Under Test

- Commit: `9009854`
- Date/time: 2026-06-19 20:09 -04:00
- Tester: Codex
- Device: Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- App package: `com.anonymous.memorypalace`
- Install type: standalone release APK from the biometric guard build

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- `npm run pixel8:install-standalone`: pass

## Temporary Server

- URL on device: `http://127.0.0.1:8767/memory-palace-webdav.json`
- Expected credentials: `qa-user` / `qa-pass`
- Temporary server behavior:
  - `401 Unauthorized` for missing or wrong Basic auth.
  - `404 Not Found` for first authenticated `GET` before a record exists.
  - `200 OK` for authenticated `PUT` and later `GET`.

## Device Gate

- WebDAV Settings fields accepted URL, username, password, and sync passphrase through the Pixel 8a UI: pass.
- Wrong credential run: pass.
  - Used username `qa-user` with password `wrong-pass`.
  - App showed `WebDAV sync failed: WebDAV GET failed: 401 Unauthorized`.
  - Server saw two authenticated `GET` attempts with the wrong Basic auth header and no `PUT`.
- Correct credential run: pass.
  - Replaced the password with `qa-pass` and kept the same URL, username, and sync passphrase.
  - App showed `WebDAV sync complete. Pushed 3, pulled 0.`
  - Server saw authenticated `GET`, `GET`, `PUT`, then `GET`.
- Remote record encryption: pass.
  - Stored record format was `memory-palace.archive.encrypted.v1`.
  - Stored payload length was 334,877 bytes.
  - Stored payload did not contain checked plaintext tokens: `Grandma`, `Queens`, `silver train`, `Maple`, `baselineqa`, `Patrick`, or `Maya`.
- Cleanup: pass.
  - Removed the ADB reverse mapping.
  - Stopped and deleted the temporary local server files.
  - Removed temporary UIAutomator XML dumps from the device.
- App-process log slice after the flow had no matching fatal exception, React Native error, or visible red screen.

## Deferrals

- Non-loopback WebDAV provider QA remains open.
- Remote conflict handling remains open.
- Restart/resume sync behavior against an existing remote record remains open.

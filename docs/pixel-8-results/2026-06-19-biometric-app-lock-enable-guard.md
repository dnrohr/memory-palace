# Pixel 8a Biometric App-Lock Enable Guard

## Build Under Test

- Commit before change: `5c196be`
- Date/time: 2026-06-19 19:59 -04:00
- Tester: Codex
- Device: Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- App package: `com.anonymous.memorypalace`
- Install type: standalone release APK

## Change Under Test

- Biometric app-lock enable now requires one successful Android local-authentication prompt before `biometric` mode is persisted.
- If the prompt is cancelled, unavailable, or not enrolled, Settings shows a visible message and leaves app lock disabled.
- Successful enable keeps the current session unlocked; `Lock now` remains the explicit way to test unlock after enabling.

## Local Gate

- `npm run build`: pass
- `npm test`: pass, 29 files / 156 tests
- `npm run pixel8:preflight`: pass
- `npm run pixel8:install-standalone`: pass

## Pixel 8a Device QA

- Open Settings -> Security: pass.
- Starting state: `Mode: disabled`, `Hide previews in switcher: no`.
- Tap `Enable biometric`: pass.
- Android system authentication sheet appeared with:
  - App: `memory palace`
  - Prompt: `Enable biometric lock`
  - Instruction: `Touch the fingerprint sensor`
  - Fallback action: `Use PIN`
  - Cancel action: `Cancel`
- Cancel authentication through ADB Back: pass.
- Return to app Settings after cancellation: pass.
- App lock remained disabled after cancellation: pass.
- Visible failure/recovery message: pass, `Biometric unlock was not completed.`
- App-process log slice after the flow had no matching fatal exception, React Native error, or visible red screen.

## Roadmap Result

- Milestone 10 no longer has a lockout-prone biometric enable path: biometric mode is not persisted until local authentication succeeds.
- Full biometric success QA was later completed by the user on the Pixel 8a: biometric/device credentials worked after the Android authentication prompt. The ADB-run portion of this pass covered prompt display, cancellation safety, and app stability; the user-held device pass supplied the physical credential success that ADB cannot provide.

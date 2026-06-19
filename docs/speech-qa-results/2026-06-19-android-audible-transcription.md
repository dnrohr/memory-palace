# Android Audible Speech QA Result

## Build Under Test

- App code commit under test: `059e85c`
- Documentation baseline during run: `ce70a0d`
- Date/time: 2026-06-19 19:40 -04:00
- Tester: Codex
- Device: Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- App package: `com.anonymous.memorypalace`
- Install type: standalone release APK

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- `npm run pixel8:install-standalone`: pass

## Android Voice Flow

- Standalone app launch: pass.
- Android microphone permission: pass, `android.permission.RECORD_AUDIO` was granted and AppOps reported `allow`.
- Open Voice capture from New Memory: pass.
- Hold-to-speak interaction: pass, the primary control accepted a sustained press and recorded for 9 seconds.
- Audible transcription: pass.
  - Spoken phrase: `The silver train arrived at Maple Station after dinner.`
  - Captured transcript: `the silver train arrived at Maple station after dinner`
- Draft review state: pass, the UI showed `Status: draft ready`, transcript review text, `Audio: 9s`, optional audio-retention copy, and `Save voice memory`.
- Save voice memory: pass, saving returned to Explore with `Memory saved.` feedback.
- Persistence after force-stop/relaunch: pass, Explore showed the saved voice memory after app restart.
- Search saved transcript: pass, searching for `station` kept the focused search field visible with the keyboard open and showed a matching text suggestion.

## Log Check

- App-process log slice after the speech flow showed normal `ReactNativeJS` startup only.
- No app-process fatal exception, React Native error, or visible red screen was observed during the run.

## Roadmap Result

- Milestone 3 now has Pixel 8a evidence for audible Android transcription, hold-to-speak capture, transcript review, voice memory save, persistence, and searchability.
- iOS speech recognition QA, accepted web speech-recognition permission QA, explicit long-pause transcription, and active-recording background interruption recovery remain open.

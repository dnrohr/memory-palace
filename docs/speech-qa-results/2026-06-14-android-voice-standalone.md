# Android Voice QA Result

## Build Under Test

- Commit before change: `508680a`
- Date/time: 2026-06-14 00:32 -04:00
- Tester: Codex
- Device: Pixel 8a, Android 16, ADB serial `47091JEKB05516`
- App package: `com.anonymous.memorypalace`
- Install path: `npm run pixel8:install-standalone`

## Local Gate

- `npm run verify`: pass
- `npm run pixel8:preflight`: pass
- `npm run pixel8:install-standalone`: pass, rebuilt and installed the release APK on the attached phone

## Android Voice Flow

- Cold launch standalone app: pass, Explore rendered without Metro or development launcher.
- Android microphone permission: pass, `android.permission.RECORD_AUDIO` was granted and AppOps set to allow.
- Open New Memory from Explore: pass.
- Open Voice from `Hold to speak`: pass.
- Start recording: pass, status changed to `Status: recording` and the button changed to `Stop recording`.
- Stop after silence: pass, Android speech recognition returned `no-speech`, the app remained live, and the UI settled into `Status: draft ready` with the editable transcript field.
- Visible recovery path: pass, the transcript editor showed `Type or paste the transcript`.
- Fatal logcat check: pass, no `FATAL EXCEPTION` found after the voice flow.

## Evidence

- Recording state screenshot: `docs/speech-qa-results/2026-06-14-android-voice-recording.png`
- Draft-ready recovery screenshot: `docs/speech-qa-results/2026-06-14-android-voice-after-stop.png`

## Deferrals

- Exact Pixel 8 hardware: not tested because the attached device identifies as Pixel 8a.
- Audible speech transcription acceptance: not tested; this automated pass exercised the no-speech recovery path.
- Background interruption during active recording: not tested in this pass.
- iOS speech recognition permission, interruption, and fallback QA: not tested because no iOS device was attached.

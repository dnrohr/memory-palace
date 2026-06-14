# Web Speech QA Result

## Build Under Test

- Commit: a1792dd
- Date/time: 2026-06-13 19:12 -04:00
- Tester: Codex
- Browser target: in-app browser at `http://localhost:8092`
- Server command: `npx expo start --web --port 8092 --clear`

## Local Gate

- `npm run verify`: pass, run earlier in the same roadmap pass
- Web app startup: pass
- Notes: Explore rendered, then New Memory and Voice capture surfaces rendered in the browser.

## Web Voice Flow

- Open New Memory: pass
- Open voice capture from `Hold to speak`: pass
- No-audio-retention copy visible: pass
- Voice status visible before recording: pass, `Status: ready`
- Start recording control visible: pass
- Browser microphone permission path: denied by browser environment
- Visible denial handling: pass, `Microphone permission was denied.`
- Recoverable retry affordance: pass, `Try again`
- Console errors: none observed

## Deferrals

- Actual accepted-microphone recording: not tested because the browser environment denied microphone access.
- Web transcription success path: not tested.
- iOS speech recognition permission, interruption, and fallback QA: not tested because no iOS device was attached.
- Android native speech recognition permission, interruption, and fallback QA: not tested because the available Pixel 8a development client did not complete the Metro connection in this pass.
- Pixel 8a audible speech QA remains open.

# Pixel 8a Device QA Result

Copy this template into the implementation log, PR notes, or a dated file when a major mobile-facing change is tested on the Pixel 8a development build.

## Build Under Test

- Commit:
- Date/time:
- Tester:
- Pixel 8a Android version:
- Development build install date/time:
- Connection mode: LAN / tunnel / USB

## Local Gate

- `npm run verify`: pass / fail
- `npm run pixel8:preflight`: pass / fail
- Notes:

## Device Gate

- App launches without a red error screen: pass / fail / not tested
- Explore screen renders and remains responsive: pass / fail / not tested
- Create and save a text memory: pass / fail / not tested
- Reopen app and confirm saved memory loads: pass / fail / not tested
- Open memory detail: pass / fail / not tested
- Edit memory and confirm persistence: pass / fail / not tested
- Search saved memory text: pass / fail / not tested
- Review suggestions or metadata actions: pass / fail / not tested
- Soft-delete test memory: pass / fail / not tested
- JSON export: pass / fail / not tested
- Markdown export: pass / fail / not tested
- Settings sections render: pass / fail / not tested
- Archive/encryption flow, if affected: pass / fail / not tested / not applicable
- App lock flow, if affected: pass / fail / not tested / not applicable
- Voice capture flow, if affected: pass / fail / not tested / not applicable

## Permission Prompts

- Microphone:
- Speech recognition:
- Files/documents:
- Biometrics:

## Failures Or Deferrals

- Red screens, visible errors, or console errors:
- Failed checklist items:
- Deferred device-QA items and reason:
- Follow-up issue or roadmap item:

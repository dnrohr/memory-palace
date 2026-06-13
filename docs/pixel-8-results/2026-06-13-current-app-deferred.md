# Pixel 8 Device QA Result

## Build Under Test

- Commit: `ab8ed3a`
- Date/time: 2026-06-13
- Tester: Codex local verification
- Pixel 8 Android version: not tested
- Development build install date/time: not tested
- Connection mode: not tested

## Local Gate

- `npm run verify`: pass
- Notes: Local verification passed after rerunning outside the restricted sandbox because Vitest/esbuild could not load `vitest.config.ts` under the managed Windows filesystem profile.

## Device Gate

- App launches without a red error screen: not tested
- Explore screen renders and remains responsive: not tested
- Create and save a text memory: not tested
- Reopen app and confirm saved memory loads: not tested
- Open memory detail: not tested
- Edit memory and confirm persistence: not tested
- Search saved memory text: not tested
- Review suggestions or metadata actions: not tested
- Soft-delete test memory: not tested
- JSON export: not tested
- Markdown export: not tested
- Settings sections render: not tested
- Archive/encryption flow, if affected: not tested
- App lock flow, if affected: not tested
- Voice capture flow, if affected: not tested

## Permission Prompts

- Microphone: not tested
- Speech recognition: not tested
- Files/documents: not tested
- Biometrics: not tested

## Failures Or Deferrals

- Red screens, visible errors, or console errors: none observed in local checks; physical-device runtime not tested.
- Failed checklist items: none from local gate.
- Deferred device-QA items and reason: the current Codex environment has no attached Pixel 8, no ADB-visible Android device, and browser automation is blocked by the Windows sandbox, so the Pixel 8 development-build gate remains open.
- Follow-up issue or roadmap item: run `npm run pixel8:build`, `npm run pixel8`, and the full `PIXEL_8_TEST.md` checklist on the physical Pixel 8.

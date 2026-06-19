# Pixel 8a Button Feedback and Keyboard Visibility QA

Date: 2026-06-19
Device: Pixel 8a
Android package: `com.anonymous.memorypalace`

## Scope

Validate the mobile UX follow-up for button acknowledgement and keyboard-safe editing. The pass focused on Settings personal information because repeated Life Calendar saves had no clear user feedback and because lower Settings fields are easy for the keyboard to cover.

## Local Checks

- `npm run build`: passed
- `npm test`: passed, 156 tests
- `npm run pixel8:preflight`: passed
- Clean Android release build: passed
- Standalone APK install: passed
- `git diff --check`: passed

## Device Steps

1. Installed the standalone release APK on the Pixel 8a.
2. Force-stopped and relaunched `com.anonymous.memorypalace`.
3. Opened Settings from the bottom navigation.
4. Scrolled to Life Calendar personal information.
5. Pressed `Save life calendar` with existing saved birthday data.
6. Verified the button action produced visible status feedback and resolved to `Life calendar saved.`.
7. Focused the lower `Age at kindergarten start` field with the keyboard open.
8. Verified Android resized the app viewport and the focused input stayed visible above the keyboard.
9. Checked recent logcat output for app fatal/error signals.

## Result

Passed. Shared app buttons now provide visual pressed feedback and a short native vibration on Android. The Life Calendar save flow now announces immediate progress, resolves to a visible saved state, and skips unnecessary embedding maintenance for profile-only edits. The focused Settings input remained visible while the keyboard was open.

This pass also fixed a persistence bug found during QA: the Android SQLite archive rewrite now clears the prior `user_profile` row before inserting the current profile, avoiding a repeated-save `UNIQUE constraint failed: user_profile.id` error.

## Notes

- One intermittent Gradle incremental `:app:packageRelease` failure occurred during install attempts; a clean release build succeeded and installed.
- No screenshots were created for this pass.

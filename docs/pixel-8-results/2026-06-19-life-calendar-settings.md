# Pixel 8a Life Calendar Settings QA

Date: 2026-06-19
Device: Pixel 8a
Android package: `com.anonymous.memorypalace`

## Scope

Validate the new Settings Life Calendar controls and the Android SQLite persistence path for birthday and school-year assumptions used to map age, grade, and year suggestions.

## Local Checks

- `npm run build`: passed
- `npm test`: passed, 156 tests
- `npm run pixel8:preflight`: passed
- `npm run pixel8:install-standalone`: passed; release APK built and installed

## Device Steps

1. Launched the standalone app with `adb shell monkey -p com.anonymous.memorypalace 1`.
2. Opened Settings from the bottom navigation.
3. Scrolled to the Life Calendar section.
4. Verified the section rendered with fields for Birth year, Birth month, Birth day, School start month, and Kindergarten start age.
5. Verified the default preview said a birth year is required before age/grade conversion.
6. Entered birthday `1985-03-12`, left school start month `8` and kindergarten start age `5`, and tapped Save life calendar.
7. Verified the save status and preview:
   - `Life calendar saved.`
   - `Age 8 maps to 1993-03-12 to 1994-03-11.`
   - `3rd grade maps to 1993-08-01 to 1994-06-30.`
8. Force-stopped and relaunched the app.
9. Returned to Settings and verified the saved values and preview persisted.
10. Checked recent logcat output for app fatal/error signals.

## Result

Passed. The Settings UI rendered on Pixel 8a, accepted and saved the birthday, generated the expected age/grade conversion preview, and preserved the profile after force-stop/relaunch through SQLite storage. The checked log slice showed normal startup/UIAutomator output and no app `FATAL EXCEPTION`.

## Label Follow-Up

After the first QA pass, the Life Calendar inputs were updated to use persistent labels and short helper hints instead of relying on placeholder-only text. A fresh standalone Pixel 8a install rendered explicit labels for `Your birth year`, `Your birth month`, `Your birth day`, `Month school year starts`, and `Age at kindergarten start`; the saved values `1985`, `3`, `12`, `8`, and `5` were still visible, and the age/grade preview remained unchanged. The checked log slice only showed UIAutomator runtime lines and no app fatal exception.

## Notes

- The app had existing Qwen/BGE local-model settings and one memory from prior QA data; this pass did not reset app data.
- No screenshots were created for this pass.

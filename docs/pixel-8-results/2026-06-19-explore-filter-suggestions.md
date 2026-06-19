# Pixel 8a Explore Filter Suggestions QA

Date: 2026-06-19

Device: Pixel 8a (`47091JEKB05516`, model `Pixel_8a`)

Build under test: `3cf8aa52b3d3bdb7bb41c07dedcf2639a3dbdb29`

## Commands

- `npm run pixel8:preflight`: passed.
- `npm run pixel8:install-standalone`: passed; release APK built and installed.
- `adb shell monkey -p com.anonymous.memorypalace 1`: launched app.
- UIAutomator dumps were used for on-device verification. No screenshots were created.

## Results

- Standalone app launched on Pixel 8a and could navigate from New memory to Explore.
- Explore rendered the search-first surface with placeholder `Search memories, people, places, tags...`.
- Default Explore showed a compact `SUGGESTED FILTERS` panel with local tag/date suggestions such as `George`, `grief`, `Motorcycle`, and `Year-only dates`.
- The full tag/date inventory was not shown by default.
- Typing `grief` showed a removable `Text: grief` chip, a `SUGGESTIONS` panel, a matching `Tags` suggestion, and a `Text` snippet result.
- Tapping the visible default `grief` suggestion created a selected removable `grief` chip near the search field.
- Tapping the selected `grief` chip removed it, and the `grief` suggestion became available again.
- Opening the tune/advanced control exposed `Advanced filters`, `Hide`, the full tag inventory, and date precision chips. The advanced inventory remained behind the explicit control.
- App-specific log slice for `com.anonymous.memorypalace` showed React Native startup lines and no `FATAL EXCEPTION`, `AndroidRuntime`, `TypeError`, or app error lines during the validation window.

## Notes

- The typed-query suggestion tap was hard to target through raw ADB because the suggestion sat near the lower viewport edge while the search field retained focus. The same add/remove chip behavior was verified through a visible default tag suggestion.

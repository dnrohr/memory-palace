# Pixel 8 Run And Install Guide

This is the user-facing Pixel 8 guide for Memory Palace. Keep it current whenever the Android run, build, install, or device-QA process changes.

Use the development build when you are near the computer and want live reloads from Metro. Use the standalone install when you want to unplug the phone and test the app while away from the computer.

## Prepare The Phone

1. On the Pixel 8, enable Developer options.
2. Enable USB debugging.
3. Connect the phone over USB.
4. Unlock the phone and accept the USB debugging prompt.
5. Keep the phone unlocked during build/install commands.

If more than one Android device is connected, set `PIXEL8_DEVICE_ID` to the serial or model shown by `adb devices -l`.

PowerShell example:

```powershell
$env:PIXEL8_DEVICE_ID="DEVICE_SERIAL_OR_MODEL"
```

## Prepare The Computer

From the repository root:

```powershell
npm install
npm run pixel8:preflight
```

`pixel8:preflight` checks the local Pixel 8 scripts/docs, finds `adb`, finds Java for the Android build, and confirms an ADB-ready Android device is connected.

## Run For Live Testing Near The Computer

Install or refresh the Expo development build:

```powershell
npm run pixel8:build
```

Start Metro for the development client:

```powershell
npm run pixel8
```

Then open Memory Palace on the Pixel 8. If the Expo development launcher appears, select the running local server or the most recent server entry and wait for the JavaScript bundle to load.

If LAN loading fails, stop Metro and use the tunnel:

```powershell
npm run pixel8:tunnel
```

Use this path for active development, JavaScript changes, native-module checks, and major-change validation while the computer is available.

## Install For Away-From-Computer Testing

Install a standalone APK with the JavaScript bundle embedded:

```powershell
npm run pixel8:install-standalone
```

This command builds `android/app/build/outputs/apk/release/app-release.apk` with the local debug keystore and installs it on the connected Pixel 8. It is for local testing only, not app-store distribution.

After the command succeeds:

1. Unplug the phone.
2. Open Memory Palace from the launcher.
3. Confirm the app starts without needing Metro or the computer.
4. Test normal capture, browse, search, Settings, export/import, security, and sync flows.

If Android warns that the app is not 16 KB page-size compatible, record it in the QA result. The local-model native dependencies have previously triggered this warning on Pixel 8a hardware, so treat it as important device evidence.

## Reset Or Reinstall

Refresh the standalone app without clearing data:

```powershell
npm run pixel8:install-standalone
```

Clear app data before a clean test:

```powershell
adb shell pm clear com.anonymous.memorypalace
```

Uninstall the app:

```powershell
adb uninstall com.anonymous.memorypalace
```

Clearing data or uninstalling removes local memories and settings from the phone.

## Smoke Checklist

Run this quick pass after a fresh install:

- App launches without a red error screen.
- Explore renders and remains responsive.
- A typed memory saves successfully.
- The saved memory appears in the list and opens in detail.
- Closing and reopening the app preserves the saved memory.
- Search finds text from the saved memory.
- Settings opens and renders storage, security, export/import, and diagnostics areas.
- JSON and Markdown exports complete.
- Voice capture either records/transcribes or produces an editable recovery state.
- Archive encryption, app lock, WebDAV sync, and model-asset flows are checked when those areas changed.

Record formal results with `docs/pixel-8-result-template.md` in `docs/pixel-8-results/`.

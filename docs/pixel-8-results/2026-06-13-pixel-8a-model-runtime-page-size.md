# Pixel 8a Model Runtime QA: 16 KB Page-Size Warning

Date: 2026-06-13

Device:
- Model: Pixel 8a (`akita`)
- Serial: `47091JEKB05516`
- Target hardware: Pixel 8a

Commands run:
- `npm run verify`: pass earlier in this roadmap pass after BGE/Qwen runtime-loader updates
- `npm run pixel8:preflight`: pass
- `npm run pixel8:build`: timed out in this shell after 10 minutes, but produced `android/app/build/outputs/apk/debug/app-debug.apk`
- `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`: pass
- `adb reverse tcp:8081 tcp:8081`: pass
- Development launcher recent server selection: Metro completed Android bundling

Observed result:
- Fresh debug APK installed successfully on the attached Pixel 8a.
- Launch showed Android's debug-app compatibility warning: `This app isn't 16 KB compatible. ELF alignment check failed.`
- The warning listed multiple native libraries, including `librnllama*.so`, `libonnxruntimejsi.so`, `libonnxruntime.so`, `libexpo-sqlite.so`, `libexpo-modules-core.so`, `libreactnative.so`, `libhermesvm.so`, and related native dependencies.
- After dismissing the warning, the Expo development launcher rendered.
- The launcher showed a recent `Memory Palace` server at `http://127.0.0.1:8081`.
- After `adb reverse` and selecting that server, Metro logged Android bundle completion for `apps/mobile/index.ts`.
- ADB became unreliable during the follow-up screenshot/log capture, so full app UI workflow QA was not completed in this pass.

Evidence files:
- `pixel8a-model-runtime-screen.png`: Android 16 KB compatibility warning
- `pixel8a-model-runtime-ok-bounds.png`: Expo development launcher after dismissing the warning

Status:
- Partial Pixel 8a evidence only.
- Full Pixel 8a model-runtime workflow QA remains open.
- Local model runtime device QA remains blocked until the native dependency 16 KB page-size compatibility warning is resolved or accepted as an Android 16/debug-build testing limitation.

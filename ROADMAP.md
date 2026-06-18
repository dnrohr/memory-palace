# memory palace roadmap

Last updated: 2026-06-18

memory palace is an offline-first, cross-platform memory archive. The durable product is the local text archive, structured metadata, user-confirmed tags, search index, timeline, life-context graph, and exportable data. AI features must remain modular, optional, local-first where possible, and unable to corrupt canonical user data without confirmation.

## Status Snapshot

| Phase | Milestones | Status |
| --- | --- | --- |
| Phase 1: Useful Without AI | 1-4 | In progress |
| Phase 2: Personal Intelligence | 5-7 | In progress |
| Phase 3: Exploration and Durability | 8-10 | In progress |
| Phase 4: Optional Expansion | 11-12 | In progress |

## Remaining Work At A Glance

### Ready to Continue Locally

- None currently. The Pixel 8a development-build workflow, local verification script, and result template are in place. The `pixel8:*` script names are historical and currently target the attached Pixel 8a.
- The user-facing Pixel 8a run/install guide is in `docs/pixel-8-run-install-guide.md`; update it whenever Android run, build, install, or device-QA processes change.
- The current app has a Pixel 8a standalone major-gate smoke pass, plus a 2026-06-18 development-client pass for the revised new-memory and typed-save flow. Full workflow QA is still required before all mobile-facing milestones can be treated as target-device verified. A partial Pixel 8a development-build run is recorded in `docs/pixel-8-results/2026-06-13-pixel-8a-partial.md`.
- A follow-up Pixel 8a development-build attempt is recorded in `docs/pixel-8-results/2026-06-13-pixel-8a-dev-client-connection.md`: local verification and preflight passed, the debug APK assembled and installed, and Metro bundled Android JS, but the Expo development launcher reported an `unexpected end of stream` before the app UI could be exercised.
- A local-model-runtime Pixel 8a pass is recorded in `docs/pixel-8-results/2026-06-13-pixel-8a-model-runtime-page-size.md`: preflight passed, a fresh debug APK installed, Android showed a 16 KB page-size compatibility warning for native libraries including `llama.rn`, ONNX Runtime, Expo SQLite, Expo modules, React Native, and Hermes, the dev launcher rendered after dismissing the warning, and Metro completed Android bundling after selecting the recent server. Full app UI workflow QA remains open because ADB became unreliable during follow-up capture.
- A standalone-install launch pass is recorded in `docs/pixel-8-results/2026-06-14-standalone-install-launch.md`: local verification and preflight passed, the release APK built and installed on the attached Pixel 8a, and the app launched directly into Explore without Metro or the development launcher. Full workflow QA remains open.
- A standalone major-gate smoke pass is recorded in `docs/pixel-8-results/2026-06-14-standalone-major-gate-smoke.md`: on the attached Pixel 8a, startup, Explore, text memory save/detail, force-stop persistence, keyword search, Settings visibility, local model fallback visibility, and export/import surface presence passed. Voice no-speech recovery also passed separately; app lock, archive encryption, share-sheet exports/import, WebDAV, audible speech, and actual model-asset QA remain open.
- A 2026-06-18 Pixel 8a development-client retry passed for the changed capture flow after fixing local Metro routing and a runtime dynamic-import failure in `expo-file-system`: the app opened on New memory, the text box stayed hidden until `Type instead`, the keyboard stayed down on entry, a typed memory saved successfully, and the app returned to Explore with the saved memory visible. The Android 16 KB native-library compatibility warning still appears, and audible hold-to-speak transcription remains open.
- A 2026-06-18 Pixel 8a standalone workflow/encryption run is recorded in `docs/pixel-8-results/2026-06-18-standalone-workflow-encryption.md`: local verification passed, the release APK built and installed, the encrypted JSON export path no longer reports missing secure random bytes, and encrypted local backup synced on-device with `Pushed 4, pulled 0`. Native export sharing now uses Expo Sharing, but Pixel chooser verification is blocked until the encrypted archive unlock state is resolved or QA app data is reset with approval.
- A 2026-06-18 local-model mode wiring pass is recorded in `docs/pixel-8-results/2026-06-18-local-model-mode-wiring.md`: Settings now exposes Qwen local structured extraction and BGE local embedding engine modes separately from embedding maintenance, with guarded fallback behavior. Local build/tests passed, the first Android release bundle exposed a Transformers.js/`onnxruntime-web` Metro packaging issue for BGE, and the final standalone APK build/install passed after keeping BGE execution on the hash fallback until tokenizer packaging is solved.
- A 2026-06-18 BGE tokenizer packaging pass is recorded in `docs/pixel-8-results/2026-06-18-bge-tokenizer-packaging.md`: native BGE loading now uses a bundled tokenizer-json WordPiece parser instead of Transformers.js, the unused Transformers.js dependency and transitive `onnxruntime-web` package were removed, local build/tests passed, and the standalone Pixel 8a APK built/installed without the previous Metro parse failure. Actual BGE asset QA remains open.
- A 2026-06-18 Pixel 8a share/import/model-controls follow-up is recorded in `docs/pixel-8-results/2026-06-18-share-import-model-controls.md`: after a standalone reinstall, the app opened to New memory instead of the prior encrypted archive unlock screen, Settings rendered, Qwen/BGE mode controls toggled and showed missing-asset fallback state, Android share chooser handoff passed for JSON, Markdown, Markdown bundle, and SQLite SQL exports, the Import action opened Android's document picker, a no-BOM JSON archive previewed/applied from Android Downloads and appeared in Explore, malformed BOM JSON showed a parse error, and a temporary PIN app-lock smoke passed with lock, unlock, and disable verified. Markdown import preview/apply, biometric app lock, archive migration/unlock, WebDAV, and actual model-asset QA remain open.
- Archive-at-rest encryption is now wired through the Settings save flow on web: enabling archive scope requires an archive passphrase, writes the encrypted local archive, clears plaintext primary storage, and reloads into the archive unlock screen. Web round-trip evidence is recorded in `docs/encryption-qa-results/2026-06-13-web-archive-at-rest.md`. Android now has a native-compatible AES-GCM/PBKDF2 fallback and mobile secure-random injection, but the Pixel 8a archive-scope Settings save action still needs a fresh migration/unlock pass; older evidence is recorded in `docs/encryption-qa-results/2026-06-14-android-archive-native-crypto.md`.

### Needs Model Runtime Wiring Or Device QA

- Milestone 6: production structured-extraction target selected as `Qwen2.5-0.5B-Instruct` through `llama.rn`; portable runtime adapter, checked asset manifest, guarded engine factory, Expo document-storage asset discovery, native `llama.rn` context loader, and guarded user-facing Qwen mode are present. Pixel 8a missing-asset fallback UI passed; actual model-asset QA remains open.
- Milestone 7: production embedding target selected as `BAAI/bge-small-en-v1.5` through ONNX Runtime; portable BGE adapter, checked asset manifest, guarded engine factory, Expo document-storage asset discovery, tokenizer-json WordPiece parser, ONNX Runtime loader, and user-facing guarded BGE mode are present. Pixel 8a missing-asset fallback UI passed; actual asset QA remains open.
- Milestone 11: WebDAV encrypted sync is the first production sync provider target; device QA remains before treating it as complete.

### Needs Device QA

- Run the Pixel 8a development-build checklist for the current app and record results in `docs/pixel-8-results/`.
- Milestone 1: mobile/tablet/web smoke QA on real target devices.
- Milestone 2: device-level search and keyboard QA.
- Milestone 3: iOS, audible Android transcription, and full web speech-recognition QA, including accepted permission prompts, long pauses, hold-to-speak behavior, background interruption, and transcription fallback. Web denied-permission fallback evidence is recorded in `docs/speech-qa-results/2026-06-13-web-denied-permission.md`; Android standalone no-speech recovery evidence on the attached Pixel 8a is recorded in `docs/speech-qa-results/2026-06-14-android-voice-standalone.md`.

## Major Change Test Gate

Major changes must pass the normal local checks and a Pixel 8a device check before they are considered complete.

- Local gate: `npm test` and `npm run build`.
- Device gate: run the app on the Pixel 8a development build or standalone APK, exercise the affected workflow, and confirm startup, navigation, persistence, and visible error handling still work.
- Required for: native mobile setup, SQLite/storage migrations, archive encryption/unlock, app lock, speech/audio capture, import/export, sync/backup, navigation shell changes, and major UI flows.
- Deferral rule: if Pixel 8a testing is not possible, record the blocker in the implementation log and keep the affected work marked as needing device QA.
- Screenshot hygiene: disposable screenshots created during device or browser QA should be written under `.codex-screenshots/<task-name>/` and removed with `npm run screenshots:cleanup -- --dir .codex-screenshots/<task-name> --yes` before finishing. Durable QA screenshots belong in `docs/` and should be mentioned in the result notes.

## Implementation Log

### 2026-06-18

- Revised the capture-first app startup: the app now opens on New memory, presents voice capture first, keeps the typed text box hidden until the user chooses `Type instead`, and avoids raising the keyboard on entry.
- Changed memory saves to show a visible `Memory saved.` notice and return to Explore, reducing accidental duplicate saves from repeated save taps.
- Improved speech capture for longer pauses by enabling continuous recognition and preserving final plus interim transcript chunks; updated the voice control so the primary recording interaction behaves as hold-to-speak with a fallback stop action while recording.
- Improved tag handling by adding shared tag parsing for comma, semicolon, hashtag, newline, and double-space separated input; normalized manual tags; expanded rule-based everyday tag suggestions; and added tests for tag parsing and hashtag suggestions.
- Standardized current user-facing app naming to lower-case `memory palace` across app config, Android strings, lock copy, date-extraction copy, and README text.
- Fixed a Pixel 8a development-client runtime failure caused by dynamically importing `expo-file-system` from the local model asset store; switched it to a static import.
- Retried the changed flow on the attached Pixel 8a: `npm run pixel8:preflight` passed, Metro routing was repaired with ADB reverse, the Android 16 KB native-library compatibility warning was dismissed, the app opened on New memory, the text field stayed hidden until requested, and a typed memory saved back to Explore with the new memory visible. Audible speech capture QA remains open.
- Added `AGENTS.md`, `.codex-screenshots/` gitignore coverage, and `npm run screenshots:cleanup` so future agents have a safe dry-run-first path for deleting only disposable screenshots they created.
- Ran `npm run build` and `npm test`; both passed after the capture, tag, speech, and naming changes.
- Fixed standalone Android encrypted-export randomness by adding an injectable secure-random source to `WebCryptoExportEncryptionProvider` and wiring mobile encryption flows to `expo-crypto`.
- Added regression coverage for injected secure random values when global Web Crypto is unavailable.
- Ran `npm run verify` and `npm run pixel8:install-standalone`; both passed after the mobile secure-random fix.
- Re-ran Pixel 8a standalone encryption QA: encrypted JSON export no longer shows `Secure random bytes are unavailable in this runtime`, and encrypted local backup synced on-device with `Encrypted backup synced. Pushed 4, pulled 0.` Android share-sheet handoff still needs explicit follow-up because the chooser did not visibly take foreground focus under ADB.
- Switched native export handoff from React Native `Share.share` with a file URL to Expo `Sharing.shareAsync` with a cache-file URI and media type, keeping the web/text fallback.
- Rebuilt and installed the standalone APK with `expo-sharing`; local build/tests passed, and the Pixel install passed. Chooser verification remains open because the device now starts on the encrypted archive unlock screen from the prior encryption run, and ADB unlock attempts did not dispatch a success or visible error state.
- Hardened PIN and passphrase inputs by disabling autocapitalization/autocorrect, and added keyboard Done submission for archive unlock. Local build/tests and Pixel standalone install passed; the existing encrypted archive still could not be unlocked through ADB automation with the known QA passphrases, so manual device interaction or approved QA app-data reset was needed before more chooser/export QA.
- Added explicit local-model mode wiring: Settings now separates structured extraction mode (`off`, local rules, Qwen local), embedding engine mode (hash local, BGE local), and embedding maintenance mode (automatic/manual). Qwen attempts the local model only when selected and falls back to rules if assets/runtime are unavailable; BGE remains visibly selectable but continues using hash embeddings until the native tokenizer packaging issue is solved.
- Added settings-store regression tests for older settings defaulting to hash embeddings and for persisted Qwen/BGE mode choices.
- Ran `npm run build`, `npm test`, and `npm run pixel8:install-standalone` for the local-model mode wiring. The first standalone build exposed a Metro failure from `onnxruntime-web` when BGE runtime loading was statically imported; after moving BGE execution back behind the hash fallback, the standalone APK built and installed successfully.
- Replaced the native BGE Transformers.js tokenizer path with a bundled tokenizer-json WordPiece parser, wired BGE mode back to the guarded ONNX engine factory, removed the unused Transformers.js dependency, and kept hash fallback behavior for missing assets or runtime load failures.
- Ran `npm run build`, `npm test`, `git diff --check`, and `npm run pixel8:install-standalone` for the BGE tokenizer packaging pass. The standalone APK built and installed on Pixel 8a without the previous `onnxruntime-web` Metro parse failure.
- Improved the encrypted archive unlock screen so failed decrypt attempts show a stable archive-specific error and the unlock button displays an `Unlocking...` pending state instead of adding a generic child-view failure message.
- Ran a Pixel 8a standalone share/import/model-controls follow-up: the app was reachable again without clearing app data, Settings rendered, Qwen/BGE missing-asset fallback controls toggled on-device and were restored to defaults, Android share chooser handoff passed for JSON, Markdown, Markdown bundle, and SQLite SQL exports, and the Import action opened Android's document picker.

### 2026-06-14

- Added a user-facing Pixel 8a run/install guide covering the development-client workflow for live testing near the computer and a standalone APK install path for away-from-computer testing.
- Added `npm run pixel8:install-standalone`, which builds the Android release APK with the local debug keystore and installs it on the first ADB-ready Android device.
- Ran `npm run verify` and `npm run pixel8:preflight`; both passed.
- Ran the standalone install path on the attached Pixel 8a running Android 16: the release APK built and installed, the package was present, the app process launched, Explore rendered, and recent logcat output showed no fatal exception in the captured launch window. Full workflow QA remains open.
- Ran a standalone major-gate smoke pass on the attached Pixel 8a: saved a typed memory, opened detail, force-stopped and relaunched to confirm persistence, searched for the saved text, verified Settings/local model fallback/diagnostics surfaces, confirmed export/import controls are present through UIAutomator evidence, and found no `FATAL EXCEPTION` in the final logcat check. Voice no-speech recovery passed separately; app lock, archive encryption, share-sheet export/import, WebDAV, audible speech, and actual model-asset QA remain open.
- Replaced the Android audio-capture stub with a native `expo-speech-recognition` capture session, wired captured transcripts directly into the voice draft flow, and treated Android `no-speech` results as an editable empty transcript instead of a hard failure.
- Ran Android standalone voice QA on the attached Pixel 8a: microphone permission was granted, voice recording started, Android speech recognition returned `no-speech` for the silent automated pass, the app recovered into `Status: draft ready` with an editable transcript field, and recent logcat output showed no `FATAL EXCEPTION`. Audible transcription acceptance, background interruption, and iOS speech QA remain open.
- Added a native-compatible AES-GCM/PBKDF2 encryption fallback for Android runtimes with secure random bytes but without Web Crypto `subtle`, while preserving the existing encrypted envelope format.
- Ran Android standalone archive-at-rest QA on the attached Pixel 8a: the release APK built and installed, local crypto tests passed, saving `disabled` encryption options succeeded, and final relaunch loaded Explore with no `FATAL EXCEPTION`. Attempting to save archive scope with a passphrase still did not dispatch the archive save action on-device, so archive-at-rest Android QA remains open and is documented in `docs/encryption-qa-results/2026-06-14-android-archive-native-crypto.md`.
- Fixed Pixel 8a status-bar overlap by moving the app root to `react-native-safe-area-context`, setting an explicit Android status bar treatment, rebuilding and installing the standalone APK, and recording screenshot evidence in `docs/pixel-8-results/2026-06-14-safe-area-statusbar.png`.
- Tightened grade/age date suggestions: without a birth year, memory palace now explains that grade or age mentions cannot be mapped to calendar dates, and review cannot accept those incomplete suggestions as confirmed dates.

### 2026-06-13

- Promoted Pixel 8a testing to the top implementation priority: use an Expo development build, repeatable phone-start scripts, and a device-testing runbook rather than relying on Expo Go for the main app.
- Added a major-change test gate requiring Pixel 8a development-build or standalone QA for substantial mobile, storage, encryption, speech, sync, navigation, and data-model changes before they are considered complete.
- Added `expo-dev-client`, Pixel 8a start/build scripts, and `PIXEL_8_TEST.md` so Android device QA has a repeatable development-build path.
- Added `npm run verify` and a Pixel 8a result template so the local gate and device evidence can be recorded consistently for major changes.
- Added `npm run pixel8:preflight` to check Pixel 8a QA readiness before build/install: required scripts/docs, `adb` availability, and ADB-visible Android devices.
- Made additive SQLite migrations idempotent when the latest schema already contains the target columns, reducing device-test failures on fresh or partially migrated local databases.
- Added a visible archive-load failure state with retry so startup storage errors do not leave the app stuck on an indefinite loading screen.
- Recorded the current-app Pixel 8a gate status in `docs/pixel-8-results/2026-06-13-current-app-deferred.md`: local verification passed, but physical Pixel 8a QA was deferred at that time because the environment had no attached device.
- Ran the Pixel 8a preflight locally; it failed with the actionable blocker that `adb` is not available on PATH in this environment.
- Added a GitHub Actions `Verify` workflow so the documented local gate (`npm ci` and `npm run verify`) runs on pushes to `main` and pull requests.
- Rechecked the Pixel 8a blocker: `adb` is not on PATH, no standard Windows Android SDK `adb.exe` path is present, and no physical Pixel 8a is attached in this environment.
- Added a UI polish batch from `UI_DESIGN_DOCUMENT.md`: wide Explore now uses a two-pane composition, theme shelves use a reusable `ThemeClusterCard`, and core Settings trust/control areas use a reusable `SettingsSection` surface.
- Ran `npm run verify` for the UI polish batch; build, all 102 tests, and Expo public config passed.
- Ran local web visual QA on `http://localhost:8081`: wide Explore rendered as a two-pane layout, Settings rendered the new section surfaces, mobile-width Explore stayed stacked, and no horizontal overflow or console errors appeared.
- Re-ran the Pixel 8a preflight for the UI polish batch; it still fails because `adb` is not available on PATH, so physical device QA remains deferred.
- Improved Pixel 8a device readiness automation: preflight now discovers `adb` in PATH and standard Android SDK locations, checks for a Java runtime in `JAVA_HOME`, Android Studio JBR, and common JDK folders, distinguishes ready/offline/unauthorized devices, and has helper tests.
- Replaced the interactive `pixel8:build` script with a non-interactive wrapper that selects the first ADB-ready device and wires detected Java into the Expo Android build.
- Ran a partial physical-device development-build QA pass on an attached Pixel 8a running Android 16: preflight passed, the debug APK built/installed, the app bundle loaded through the dev client, Explore rendered, a text memory saved to detail, the saved memory reappeared after reconnecting post-restart, Settings rendered, and search field/keyboard focus worked. Full Pixel 8a workflow QA remains open.
- Re-ran the current-app Pixel 8a gate on the available Pixel 8a: `npm run verify` and `npm run pixel8:preflight` passed, direct Gradle debug assembly and `adb install -r` passed, and Metro completed Android bundles. Full workflow QA remains deferred because the Expo development launcher reported `unexpected end of stream` when connecting to the local Metro server.
- Ran web speech denied-permission QA on `http://localhost:8092`: New Memory and Voice rendered, no-audio-retention copy and ready status were visible, starting recording produced a visible `Microphone permission was denied.` state with a `Try again` recovery action, and no browser console errors appeared beyond existing style warnings. Accepted-microphone, iOS, and Android audible speech QA remain open.
- Wired archive-at-rest encryption into the Settings save flow: archive scope with user passphrase now requires a one-time archive passphrase, immediately writes the encrypted archive, clears plaintext primary storage, and disabling archive scope writes the current archive back to primary storage while clearing the encrypted record and in-memory archive passphrase.
- Ran archive-at-rest web QA on `http://localhost:8093`: Settings showed the archive passphrase migration field, saving with a test passphrase showed encrypted-archive success copy, reload displayed the encrypted archive unlock screen, unlocking returned to Explore, and no console errors appeared beyond existing style warnings.
- Ran `npm run verify` and `npm run pixel8:preflight` for the archive-at-rest Settings migration slice; both passed. Physical archive-at-rest device QA remained deferred at that point because the available Pixel 8a development client did not complete the Metro connection in the prior device pass.
- Selected production local model targets in `docs/model-selection.md`: BGE small English v1.5 for embeddings, Qwen2.5 0.5B Instruct through a llama.cpp-compatible runtime for optional structured extraction, and WebDAV encrypted sync as the first production sync target.
- Added a BGE small English v1.5 ONNX embedding adapter with model metadata, query/passage prefix handling, masked mean pooling for token embeddings, and tests for the production embedding target. Hash embeddings remain the runtime fallback until model assets and device QA are wired.
- Added a Qwen2.5 0.5B Instruct structured-extraction adapter for `llama.rn`, with chat prompt wrapping, deterministic local completion settings, optional grammar forwarding, and validation through the existing JSON structured-extraction contract. Rules remain the default until model assets and device QA are wired.
- Added a tracked `patch-package` patch for `onnxruntime-react-native@1.24.3` so its Android Gradle script works under the current Gradle toolchain, ignored generated `llama.rn` Hexagon asset sync output, and confirmed direct Android debug assembly succeeds after adding the local model runtime dependencies.
- Installed the local-model-runtime debug APK on the attached Pixel 8a successfully; partial device evidence is recorded in `docs/pixel-8-results/2026-06-13-local-model-runtime-install.md`. Full Pixel 8a model runtime QA remains open until model assets and dev-client or standalone workflow testing are complete.
- Added checked local-model asset manifests and guarded engine factories for BGE small English v1.5 and Qwen2.5 0.5B Instruct, so production local engines are created only when required asset files resolve and the app can keep using hash/rules fallbacks when files are absent.
- Added Expo document-storage model asset discovery and Settings visibility for optional BGE/Qwen model files, including a refresh action and fallback status when required files are absent.
- Added a Qwen `llama.rn` completion runtime shim plus an Expo/native loader that initializes a local llama context from the resolved GGUF asset URI and forwards deterministic JSON completion settings through the existing Qwen structured-extraction adapter.
- Added a BGE runtime loader that requires ONNX and tokenizer config assets, loads the model URI into ONNX Runtime, adapts tokenizer output into BGE feed arrays, and preserves the hash fallback until the loader is explicitly enabled after device QA.
- Ran a local-model-runtime Pixel 8a device pass: preflight passed, a fresh debug APK installed, Android reported the debug app is not 16 KB page-size compatible across multiple native libraries, the Expo development launcher rendered after dismissing the warning, and Metro completed Android bundling after selecting the recent server. Full app UI workflow QA remains open because ADB became unreliable during follow-up capture and model assets were not present.

### 2026-06-12

- Added `UI_DESIGN_DOCUMENT.md` as the design source for the app experience.
- Folded the design document into this roadmap as a product posture, UI design track, milestone mapping, and acceptance criteria.
- Prioritized the next UI implementation slice around Explore-first navigation, central capture, lower-pressure capture, and calmer review/settings surfaces.
- Implemented the first design-doc UI slice: Explore-first header, bottom navigation with central capture, path cards for timeline/context/themes, lower-pressure new-memory capture, and calmer review/search wording.
- Added a post-save suggestion sheet on newly saved memories so possible tags and dates are offered only after the memory is safely stored.
- Expanded the Explore home with continue-from language, an unknown-dates path card, and a clearer recently added/matching memories section.
- Polished memory cards and detail screens with date-certainty labels and `Nearby because` connection explanations.
- Reorganized Settings into privacy, storage, local processing, security, export/import, and cleanup sections.
- Added emotional-safety controls for marking memories sensitive, excluding them from resurfacing, and showing less like them; resurfacing prompts now skip sensitive or excluded memories.
- Added durable private notes on memories so later context can be stored without changing the original memory text.
- Added responsive shell polish for wider web/tablet layouts while keeping mobile single-column.
- Added durable life-context relationship schema/storage and graph support for explicit relationships alongside inferred co-occurrence edges.
- Added a Web Crypto AES-GCM encrypted export provider with PBKDF2 passphrase keys and Settings export controls.
- Added an optional `expo-speech-recognition` native speech-to-text adapter behind `ITranscriptionEngine`, wired voice drafts to attempt local transcription, and kept editable manual fallback on recognition errors.
- Added AppState interruption handling so active voice recordings stop into a reviewable draft when the app backgrounds.
- Added a portable archive-at-rest encryption adapter that writes encrypted archive blobs, decrypts them behind a passphrase provider, and can read plaintext records for migration.
- Added persistent app settings for encryption options, structured extraction mode, and embedding maintenance mode as a foundation for startup unlock and key lifecycle work.
- Ran a local web smoke check on `http://localhost:8081`: Explore and Settings rendered without console errors, and the Settings encryption copy reflects the archive adapter plus pending storage migration.
- Added a top-level remaining-work register to make roadmap status easier to scan by local implementation work, provider/model choices, and device QA.
- Polished search results with an active-search summary, clearer keyword/nearby section headings, and empty-state guidance with a direct clear-filters action.
- Ran local web search QA on `http://localhost:8081`: keyword search and empty-result states rendered the new summary/guidance without console errors.
- Added an opt-in encrypted backup/sync provider that syncs through the archive-at-rest adapter, pushes initial encrypted backups, pulls clean remote archives, and reports merge conflicts without enabling cloud behavior by default.
- Wired an encrypted local backup action into Settings with an explicit passphrase field, local-only copy, and no stored passphrase.
- Ran local web backup QA on `http://localhost:8081`: the encrypted backup panel rendered and completed a dummy-passphrase backup sync without console errors.
- Added a JSON-speaking local structured-extraction model adapter with prompt construction, fenced JSON parsing, result validation, and tests against a fake local model runtime.
- Added a local embedding model adapter with single/batch runtime wrapping, vector normalization, dimension checks, and tests against a fake local embedding runtime.
- Added startup unlock handling for encrypted archive-at-rest records, including a dedicated archive passphrase screen and encrypted save path after unlock.
- Ran local web startup QA on `http://localhost:8081`: the default non-encrypted startup path still rendered Explore without console errors.
- Added plaintext primary-storage cleanup after successful encrypted archive-at-rest saves.
- Ran local web storage-cleanup smoke QA on `http://localhost:8081`: the app still rendered Explore without console errors.
- Added a visual Explore polish pass inspired by the UI design document: warmer private-notebook capture surface, clearer `Ways in` hierarchy, and low-saturation varied path cards for timeline, people/pets, places, themes, and unknown dates.
- Ran local web visual QA on `http://localhost:8081`: mobile viewport rendered the new Explore hierarchy without horizontal overflow or console errors, and normal-width DOM checks confirmed the path cards were present without overflow.
- Added an opt-in WebDAV sync provider target that stores encrypted archive-at-rest records over WebDAV with explicit credentials and passphrase-gated sync.
- Added WebDAV sync tests for encrypted initial push, Basic auth header construction, encrypted payload storage, and disabled sync without a passphrase.
- Wired WebDAV encrypted sync into Settings with explicit URL, credentials, and sync-passphrase fields; credentials and passphrase are used for the sync action and not stored.
- Ran local web Settings QA on `http://localhost:8081`: the WebDAV encrypted sync panel rendered at normal width without horizontal overflow or console errors.
- Polished the memory detail view into a museum-label composition with a metadata plaque, a distinct original-memory reading panel, and stronger nearby-memory connection labels.
- Ran local web detail QA on `http://localhost:8081`: normal and mobile-width detail views rendered the new labels and connection explanation without horizontal overflow or console errors.
- Polished the people, pets, places, and life-period context screen into constellation-style entity cards with memory counts, recurring details, linked memories, and connection explanations.
- Ran local web context QA on `http://localhost:8081`: empty entity states, populated pet constellation cards, and mobile-width navigation rendered without horizontal overflow or console errors.
- Polished the Themes path into readable theme shelves backed by tag data, with related-tag context, connected memory previews, and tag-management controls moved below the browsing surface.
- Ran local web Themes QA on `http://localhost:8081`: normal and mobile-width theme shelves rendered related tags, connected memories, and management controls without horizontal overflow or console errors.
- Polished the Review inbox into a quiet optional-maintenance surface with a `Review when you want` summary, possible-detail cards, source context, explanation copy, and explicit edit actions.
- Ran local web Review QA on `http://localhost:8081`: normal and mobile-width Review rendered optional-review language and actions without horizontal overflow, console errors, or chore-list wording.
- Polished Settings trust surfaces with compact local-state cards and moved data-audit controls into a visually separated advanced diagnostics panel.
- Ran local web Settings QA on `http://localhost:8081`: normal and mobile-width Settings rendered trust cards and separated diagnostics without horizontal overflow or console errors.
- Polished the voice capture surface with a private-listening panel, soft waveform/timer treatment, clearer no-audio-retention copy, and gentler transcript-review language.
- Ran local web voice UI QA on `http://localhost:8081`: normal and mobile-width voice capture rendered the private recording copy, timer, waveform, and start action without horizontal overflow or console errors.
- Added shared `DateCertaintyLabel` and `ConnectionReason` UI primitives so date badges and relationship explanations render consistently across Explore, detail, Review, themes, chapters, and life-context paths.
- Ran local web component-primitive QA on `http://localhost:8081`: normal and mobile-width memory list/detail surfaces rendered date certainty and connection reason text without horizontal overflow, console errors, or mojibake separators.
- Added shared `TagPill` and `MemoryCard` UI primitives, routing the main Explore memory list and filter chips through reusable components from the design-system track.
- Ran local web card/pill QA on `http://localhost:8081`: normal and mobile-width Explore lists rendered memory titles, date badges, previews, and tags without horizontal overflow, overflowing text nodes, console errors, or mojibake separators.
- Added shared `AppShell`, `ScreenHeader`, `CenterCaptureButton`, and `BreadcrumbTrail` UI primitives so the global shell, central capture action, and Explore-path back affordance match the design-system track.
- Ran local web shell/breadcrumb QA on `http://localhost:8081`: normal and mobile-width shell/header/navigation rendered without horizontal overflow, Timeline returned through `Back to Explore`, and no console errors or mojibake separators appeared.
- Added a shared `ReviewCard` UI primitive so optional suggestion cards keep their quiet review tone, confidence badge, source context, explanations, and actions in one reusable component.
- Ran local web ReviewCard QA on `http://localhost:8081`: normal and mobile-width Review rendered optional-copy, confidence badges, source text, `Later`, `Edit`, and dismiss/accept actions without horizontal overflow, overflowing text nodes, console errors, or mojibake separators.
- Added a shared `EntityCard` UI primitive so people, pets, places, and life-period constellations keep their identity label, memory count, recurring details, linked memories, and connection explanations in one reusable component.
- Ran local web EntityCard QA on `http://localhost:8081`: normal and mobile-width context paths rendered the empty People state and populated Patrick pet constellation without horizontal overflow, overflowing text nodes, console errors, or mojibake separators.
- Aligned the possible/accepted chapter UI with the design-system `ChapterCard` primitive while preserving provisional `Possible chapter` and user-confirmed `Accepted chapter` labels.
- Ran build, full test, and local HTTP smoke verification for the `ChapterCard` alignment; in-app browser automation was unavailable in this sandboxed turn, so visual Chapter path QA remains covered by the prior chapter browser pass.
- Polished possible chapter cards with provisional framing, recurring details, memory previews, connection reasons, and quieter hide/rename/split/merge controls.
- Ran local web chapter QA on `http://localhost:8081`: normal and mobile-width chapter cards rendered provisional labels, recurring details, controls, and connection explanations without horizontal overflow or console errors.
- Added a Review `Later` action that defers suggestions for the current session without rejecting them, plus copy that makes deferred details feel tucked away rather than lost.
- Ran local web Review-later QA on `http://localhost:8081`: normal and mobile-width Review allowed deferring a visible suggestion and showed tucked-away copy without horizontal overflow or console errors.
- Added explicit `Back to Explore` navigation on Explore subpaths and memory detail so users can leave timeline, context, themes, chapters, and detail paths without relying on bottom navigation.
- Ran local web back-navigation QA on `http://localhost:8081`: normal-width Timeline and mobile-width memory detail both returned to Explore without horizontal overflow or console errors.
- Added persisted chapter acceptance so generated `Possible chapter` cards can become user-confirmed `Accepted chapter` cards, keep edited names, and sort ahead of unaccepted generated candidates.
- Ran local web accepted-chapter QA on `http://localhost:8081`: normal-width chapters accepted a visible candidate and showed accepted/user-confirmed copy; mobile-width chapters rendered without horizontal overflow or console errors.
- Added a persisted Appearance setting with light/dark modes and a first app-wide dark theme pass for the shell, navigation, capture, cards, inputs, chips, review, timeline, chapter, theme, and Settings surfaces.
- Ran local web dark-theme QA on `http://localhost:8081`: toggled dark mode in Settings, verified charcoal surfaces on Settings and Explore, confirmed persistence into a fresh mobile-width tab, and found no horizontal overflow or console errors.

### 2026-06-11

- Moved the original planning-heavy README into this roadmap and replaced `README.md` with a project README.
- Added docs for data schema v0.1, processing pipeline contract v0.1, golden fixtures, and cross-platform shell ADR.
- Added a strict TypeScript portable core with schema/types, processing contracts, rules-based cleanup/date/tag extraction, export providers, and tests.
- Added an Expo app shell for iOS, Android, and web.
- Implemented manual text memories: create, edit, list, detail, soft delete, basic search, manual tags, suggested tags/dates, approximate date fields, JSON/Markdown export actions, and local privacy disclosure.
- Added native SQLite persistence for mobile platforms and a web storage fallback pending Expo SQLite WASM bundler work.
- Added tested archive operations for search/filter, tag rename/delete, restore, permanent delete, and timeline bucket generation.
- Added app UI for tag filters, date-precision filters, tag management, timeline browsing, and deleted-memory restore/permanent delete.
- Added JSON and Markdown import preview providers, including a Markdown export/import round-trip test.
- Added archive audit summary data and expanded settings stats for active/deleted memories, tags, retained audio, confirmed/inferred dates, and processing runs.
- Added life-context schema/types for people, pets, places, and life periods, plus a tested matcher for known context mentions in memory text.
- Added optional-AI adapter seams: no-op structured extraction engine, no-op embedding engine, and embedding storage schema.
- Added transcription contract and manual-text fallback engine as the boundary for future native speech capture.
- Added archive import merge preview and merge behavior with duplicate-memory detection and tag deduplication.
- Added schema migration metadata and an idempotent migration runner.
- Added portable search service with ranking, snippets, matched tags, and tests as the adapter target for future SQLite FTS search.
- Added review inbox generation for untagged memories, tag suggestions, and date suggestions that need user confirmation.
- Added app-lock provider contract with disabled/no-op implementation for future PIN/biometric lock.
- Added optional sync provider contract with disabled/no-op implementation and conflict shape.
- Added visualization data providers for tag graph nodes/edges and shared-tag memory clusters.
- Added backup export bundle manifest and gentle resurfacing prompt generation.
- Added editable life chapter candidate generation from timeline buckets, tag clusters, and life periods.
- Added app review inbox UI for untagged memories, suggested tags, and suggested dates.
- Added tag type editing and tag merge operations with link deduplication.
- Added app UI and archive operations for managing life-context people, pets, places, and life periods.
- Added review accept/reject operations and app actions for confirming tag/date suggestions or rejecting tag suggestions.
- Added portable import workflow for provider detection, import preview, merge preview, and applying imports.
- Added Expo audio capture wrapper and app voice capture draft flow with microphone permission, recording start/stop, editable transcript, optional audio retention, and save-to-memory.
- Added a local rules-backed structured extraction engine that returns title, date, tag, and emotional-tone suggestions through the structured extraction contract.
- Added deterministic local hash embeddings and semantic search by cosine similarity as a lightweight local semantic-search baseline.
- Added related-memory ranking from shared tags, approximate time period, and optional local semantic similarity, plus a detail-screen related memories section.
- Reformatted this roadmap into a living implementation tracker.
- Added persistent memory embedding records, stale-vector detection, index rebuild/search helpers, native/web persistence, and app save/load index maintenance.
- Added a keyword/semantic search mode switch in the memory list that searches the local embedding index and keeps tag/date filters applied.
- Added timeline entry metadata and UI cues for confirmed, inferred, range, and unknown memory dates.
- Added Expo document/file portability support for JSON/Markdown export sharing and JSON/Markdown import preview/apply from picked files.
- Added a data audit report and Settings controls for local processing modes, embedding counts/bytes, generated processing logs, and retained audio reference cleanup.
- Added Explore tabs for timeline, tag graph summaries, shared-tag clusters, and editable life chapter candidates.
- Added an Expo biometric app-lock provider plus Settings controls to enable biometric lock, disable lock, lock now, and unlock the app.
- Added a prompt panel to the memory list for revisiting memories, finishing untagged memories, and filtering into common-tag prompts.
- Added a memory addendum operation and detail-screen composer for later notes and corrections without replacing the original memory.
- Added native SQLite FTS rebuild maintenance after archive saves so the FTS table stays populated on mobile.
- Added structured extraction schema/prompt metadata and validation for result shape, confidence ranges, and engine metadata.
- Added a native SQLite FTS keyword query adapter and app integration while keeping the portable search fallback for web.
- Added Settings visibility for stale embedding queue size and a manual regenerate embeddings control.
- Added persisted life chapter rename/reject decisions plus Explore controls for editing or hiding generated chapter candidates.
- Added a portable SQLite SQL dump export provider and Settings export action.
- Added richer import conflict preview details for duplicate memories, same-ID memory conflicts, and tag type conflicts.
- Added SecureStore-backed PIN app lock support with Settings controls and PIN unlock flow.
- Added typed audio capture errors plus voice-capture status, retry, and stop/save error states.
- Added tag management UI for changing tag types and merging duplicate tags.
- Added keyword search snippets with highlighted query matches and matched-tag labels in the memory list.
- Added richer storage diagnostics for estimated text, embedding, processing-output, and total local bytes.
- Added life-context graph nodes and memory edges for matched people, pets, places, and life periods.
- Added timeline filters for confirmed, inferred, unknown, point, range, and year-window views.
- Added user-selectable import conflict resolution for duplicate memories, same-ID memories, and tag type conflicts.
- Added rejected-tag feedback to suppress repeated tag suggestions for edited memories.
- Added a fast capture composer on the memory list for quick typed-memory saves.
- Added encryption settings/provider contract and Settings controls that disclose when no encryption adapter is active.
- Added Settings controls for enabling or disabling the local rules-backed structured extraction mode.
- Added memory split and merge operations with detail-screen controls, tag preservation, and stale embedding cleanup.
- Added stronger deleted-artifact cleanup for retained audio references and stale memory embeddings.
- Added richer review provenance UI for suggested tags and dates, including source text and explanations.
- Broadened rules-based metadata suggestions with month/year date extraction and additional everyday memory tag themes.
- Added embedding maintenance controls for automatic rebuilds or manual regeneration.
- Added life-context relationship edges inferred from co-occurrence plus graph neighborhood traversal and Explore UI.
- Added persisted life chapter merge and split actions with Explore controls.
- Added folder-style Markdown bundle export/import support with a manifest and Settings export action.

## Milestone Status

### 1. Product Skeleton and Local Database

Status: In progress

Done:
- App shell, CRUD, export, restore, and permanent delete.
- Native SQLite path, web fallback, and migration tracking.
- Richer settings and storage diagnostics.
- Partial Pixel 8a development-build smoke evidence for launch, Explore, save/detail, reconnect persistence, and Settings.
- Pixel 8a development-client evidence for the revised New memory startup, hidden typed-entry field, typed-save return to Explore, and visible saved-memory persistence in the list.

Remaining:
- Full target Pixel 8a device-level QA.

### 2. Manual Tags and Basic Search

Status: In progress

Done:
- Manual tag assignment, readable theme shelves, tag management, filters, tag type editing, and tag merge UI/operations.
- Shared manual tag parsing now supports comma, semicolon, hashtag, newline, and double-space separated input with normalized lower-case tag names.
- Basic search, ranked portable search snippets, keyword highlighting, and matched-tag labels.
- Active-search summaries, clearer keyword/nearby result headings, empty-state guidance, timeline v1, and native SQLite FTS rebuild/query integration.
- Partial Pixel 8a keyboard/search-field focus evidence.
- Pixel 8a standalone keyword search evidence for a saved typed memory using `searchtoken`.

Remaining:
- Full device-level search result and keyboard QA.

### 3. Voice Capture and Transcription

Status: In progress

Done:
- Transcription contract, manual-text fallback, audio capture wrapper, microphone permission handling, and typed recording errors.
- Capture status/retry states, private-listening voice UI, transcript draft flow, optional `expo-speech-recognition` native speech-to-text adapter, and native speech permissions config.
- Continuous recognition support for longer pauses, hold-to-speak interaction wiring, editable manual fallback on recognition errors, and AppState interruption/background handling.

Remaining:
- Device-level speech QA for audible Android transcription, iOS, web accepted-permission flow, long pauses, and hold-to-speak behavior.

### 4. Rules-Based Metadata Suggestions

Status: Done

Done:
- Date/tag suggestion prototypes, broader month/year and everyday-theme rules, review inbox generation, and review UI with source/explanation provenance.
- Expanded explicit hashtag and everyday-theme tag suggestions.
- Accept/reject actions, optional-review summary/cards, edit/defer/dismiss affordances, and rejected-tag feedback for future suggestions.

Remaining:
- None.

### 5. Life Context Graph

Status: Done

Done:
- People, pets, places, and life-period schema/types, app management UI, and basic text matcher.
- Graph nodes, memory-context edges, inferred co-occurrence relationship edges, graph neighborhood traversal UI, durable explicit relationship schema/storage, and graph support for explicit relationships.
- Constellation-style entity cards with quiet memory counts, recurring details, approximate periods where available, and linked memories.

Remaining:
- None.

### 6. Local Structured Extraction Model

Status: In progress

Done:
- Structured extraction interface, no-op engine, local rules-backed extraction engine, JSON-speaking local model adapter, schema validation, and prompt/version metadata.
- Settings controls for local rules extraction and a guarded Qwen local mode.
- Production target selected as `Qwen2.5-0.5B-Instruct`, with a Qwen/`llama.rn` adapter, checked GGUF asset manifest, optional grammar asset support, guarded engine factory, Expo document-storage asset discovery, and native `llama.rn` context loading.

Remaining:
- Device QA with actual Qwen model assets, including latency, memory use, fallback, and recovery behavior.

### 7. Semantic Search and Embeddings

Status: In progress

Done:
- Embedding interface, no-op engine, hash embedding engine, local embedding model adapter, semantic search, and related memories.
- Embedding storage schema, persistent vectors, stale detection, queue visibility, index rebuild/search helpers, semantic search UI, manual regeneration control, and automatic/manual embedding maintenance controls.
- Production target selected as `BAAI/bge-small-en-v1.5`, with a BGE-specific ONNX adapter, checked ONNX/tokenizer asset manifest, guarded engine factory, Expo document-storage asset discovery, tokenizer-json WordPiece parser, ONNX Runtime loader, and a user-facing BGE mode that falls back to hash when assets/runtime loading are unavailable.

Remaining:
- Device QA with actual BGE model assets and acceptable latency, memory use, fallback, and recovery behavior.

### 8. Timeline and Memory Visualization

Status: Done

Done:
- Timeline v1, timeline date certainty/range cues, richer timeline filtering, tag graph summary UI, shared-tag cluster UI, editable life chapter candidate UI, polished possible chapter cards, persisted chapter accept/rename/reject/merge/split actions, and related memories.

Remaining:
- None.

### 9. Import, Export, and Data Portability

Status: Done

Done:
- JSON/Markdown export providers, folder-style Markdown bundle export/import with manifest, SQLite SQL dump export, and backup manifest.
- JSON/Markdown import providers, platform file export/import preview/apply UI, duplicate detection, conflict preview details, archive merge behavior, and user-selectable import conflict resolution.

Remaining:
- None.

### 10. Privacy, Security, and Trust

Status: In progress

Done:
- Local processing disclosure, deleted-memory controls, archive audit counts, data audit report, storage estimates, processing-log cleanup, retained-audio reference cleanup, and deleted-artifact cleanup for audio references and stale embeddings.
- App-lock contract, Expo biometric lock provider and UI, SecureStore-backed PIN lock, encryption options contract/UI, and persisted encryption/local-processing preferences.
- Web Crypto AES-GCM encrypted export provider, portable archive-at-rest encryption adapter, startup unlock for encrypted archive records, encrypted save path after archive unlock, and plaintext primary-storage cleanup after encrypted saves.
- Mobile encryption now injects Expo Crypto secure random values into encrypted export, backup, sync, and archive adapter flows for Android runtimes without global Web Crypto random support.
- Pixel 8a standalone encrypted-local-backup QA passed with `Encrypted backup synced. Pushed 4, pulled 0.`
- Pixel 8a standalone encrypted JSON export no longer hits the secure-random unavailable error; native sharing now uses Expo Sharing, and Android chooser verification passed for JSON, Markdown, Markdown bundle, and SQLite SQL exports.
- Pixel 8a standalone JSON import preview/apply passed with a selected archive from Android Downloads; malformed BOM JSON showed a parse error before the no-BOM artifact previewed/applied and appeared in Explore.
- Pixel 8a standalone PIN app-lock smoke passed: saving a temporary PIN presented the lock screen, PIN unlock returned to the app, and disabling the lock restored `Mode: disabled`.
- Compact Settings trust cards and visually separated advanced diagnostics.

Remaining:
- Device QA for biometric app lock, Markdown import preview/apply with selected artifacts, and archive-at-rest unlock/migration paths.

### 11. Optional Cloud and Sync Layer

Status: In progress

Done:
- Sync provider contract, disabled no-sync provider, conflict shape, and opt-in encrypted backup/sync provider backed by the archive-at-rest adapter.
- WebDAV encrypted sync provider target, Settings UI for local encrypted backup sync with an explicit passphrase, and Settings UI for explicit WebDAV URL/credentials/passphrase sync.
- Pixel 8a standalone encrypted local backup sync evidence.

Remaining:
- Device QA for WebDAV sync and any cloud-AI adapters behind explicit consent.

### 12. Product Refinement and Habit Formation

Status: Done

Done:
- Review inbox data/UI, quiet optional-review surface with accept/edit/dismiss/defer actions, gentle resurfacing prompt data/UI, private voice-capture polish, related-memory prompts, memory addendum flow, durable private notes, fast capture mode, and memory split/merge flows.
- Explore-first header, bottom navigation with central capture, app startup on New memory, Explore path cards including unknown dates, readable theme shelves, continue-from language, lower-pressure voice-first new-memory capture, warmer private-notebook capture styling, clearer `Ways in` hierarchy, and low-saturation varied path cards.
- Save feedback now confirms `Memory saved.` and returns to Explore to reduce duplicate saves.
- Post-save suggestion sheet, museum-label memory detail composition, original-memory reading panel, constellation-style entity cards, possible/accepted chapter card polish, explicit back-to-Explore affordances, persisted light/dark appearance, shared app-shell, screen-header, center-capture, breadcrumb, memory-card, tag-pill, date-certainty, connection-reason, review-card, entity-card, and chapter-card UI primitives, Settings information architecture and trust-card polish, emotional-safety controls for sensitive/excluded memories, calmer search/review wording, and responsive shell polish.
- Wide Explore two-pane layout, reusable `ThemeClusterCard`, and reusable `SettingsSection` surfaces for calmer desktop/tablet browsing and trust controls.

Remaining:
- None.

## Design North Star

memory palace should feel like a private notebook at capture time, an archive box for storage and trust, a museum label on memory detail screens, and a quiet memory palace during exploration.

The main product contrast is:

- Capture removes decisions.
- Explore offers doors.

The app should not feel like an AI assistant, productivity dashboard, therapy app, social journal, CRM, or quantified-self tool. Intelligence should be modest and explainable. Structure should help the user move through memories without making the app sound certain about the user's life.

Fixed design decisions:

- Save before metadata. Title, date, tags, people, places, pets, chapters, and emotional labels are second-layer activities.
- Do not retain audio by default. The transcript is the saved memory unless the user opts into keeping the recording.
- Titles are generated or later edited, not required during capture.
- Explore begins with paths: timeline, people and pets, places, themes, chapters, unknown dates, recently added memories, and continue-from cards.
- Every generated connection explains itself in plain language.
- Generated structures remain provisional until the user accepts or edits them.
- Do not use gamification, streaks, confetti, scores, sentiment dashboards, or productivity framing.
- Put technical truth in Settings: processing modes, local/cloud state, encryption, retained audio, stale embeddings, storage estimates, logs, and diagnostics.

## Product Principles

- Offline-first and private by default.
- No required subscription, cloud inference, cloud storage, or agent tokens.
- Keep raw memory text; never overwrite it with model output.
- User-confirmed metadata wins over imported, inferred, rule-based, model, or cloud suggestions.
- All replaceable capabilities sit behind interfaces: transcription, structured extraction, embeddings, search, sync, export/import, visualization, and security.
- Export must remain boring and durable: JSON, Markdown, and eventually SQLite.

## UI Design Track

The design work from `UI_DESIGN_DOCUMENT.md` maps into the existing milestones rather than creating a competing roadmap.

| Design Area | Roadmap Placement |
| --- | --- |
| Cross-platform mobile, tablet, and desktop layouts | Milestone 1 device-level QA and Milestone 12 responsive polish |
| Search labels, theme shelves, and calmer tag browsing | Milestone 2 search polish and Milestone 12 Explore design |
| Recording state, transcript review, audio-retention copy, and interruption handling | Milestone 3 voice capture |
| Entity pages that feel like constellations rather than CRM records | Milestone 5 life-context graph and Milestone 12 Explore design |
| Local model surfaces and generated metadata wording | Milestone 6 structured extraction and Milestone 12 microcopy |
| Nearby-memory language and connection explanations | Milestone 7 semantic search and Milestone 12 memory detail polish |
| Explore home, paths, timeline/date certainty treatment, chapters, and related memories | Milestone 8 functionality plus Milestone 12 design polish |
| Privacy, storage, app lock, encryption, logs, and diagnostics information architecture | Milestone 10 trust and Settings polish |
| Optional cloud/sync visibility and consent boundaries | Milestone 11 opt-in expansion |
| App shell, central capture, post-save suggestions, Review tone, sensitive-memory controls, dark theme, motion, gestures, component system, and editing polish | Milestone 12 product refinement |

Design implementation should happen in this order:

1. App shell with Explore, central capture, Review, and Settings.
2. Lower-pressure New Memory flow with save-before-metadata behavior and transcript review language.
3. Explore home with path cards, visible-but-secondary search, recently added memories, and unknown-date entry points.
4. Memory card/detail polish with date certainty labels and connection explanations.
5. Review inbox tone and actions: accept, edit, dismiss, later.
6. Settings section reorganization for privacy, local processing, audio retention, app lock, encryption, export/import, storage, logs, and diagnostics.
7. Emotional-safety controls: sensitive memories, show less like this, exclude from resurfacing, and opt-in resurfacing.

## UI Acceptance Criteria

Capture:

- User can save a memory without title, date, or tags.
- User can save before suggestions appear.
- User understands audio is not kept unless they choose it.
- User can recover from voice or transcription failure.
- Capture does not feel like a form.

Explore:

- User can find a known memory.
- User can drift from one memory to another.
- User can browse without using search.
- User understands approximate and unknown dates.
- User can see why related memories appear.
- User can back out of any path.

Review:

- User understands suggestions are optional.
- User can accept, edit, dismiss, or defer.
- Review does not feel like a chore list.
- Rejected suggestions do not repeatedly return.

Settings:

- User understands where data lives.
- User understands export options.
- User understands audio retention.
- User understands local/cloud processing state.
- Advanced diagnostics are present but not intrusive.

## Core Architecture

```text
Mobile App UI
  -> Capture and Drafts
  -> Transcription Adapter
  -> Processing Pipeline
  -> User Confirmation Layer
  -> Local Persistence
  -> Search, Timeline, Graph, Export
```

## First Serious Prototype Definition of Done

The prototype is successful when a user can:

1. Open the app.
2. Speak or type a memory.
3. Review the transcript or text.
4. Save it locally.
5. See suggested tags and dates.
6. Confirm or reject suggestions.
7. Search later by text and tags.
8. Filter by tag and approximate date.
9. Browse an approximate timeline.
10. Export memories as Markdown or JSON.

The prototype should not require internet, subscription, cloud storage, cloud LLM, or a large local model.

Current prototype read: the typed-memory path meets this definition locally and has Pixel 8a evidence for the revised New memory/save flow, share-sheet export handoff, JSON import preview/apply, and PIN app lock. Voice capture, biometric app lock, Markdown import preview/apply, optional local model assets, and sync still need fuller target-device QA before the app should be treated as broadly hardened.

## Next Implementation Priorities

1. Complete full Pixel 8a workflow QA for the current app; the available standalone smoke pass covers startup, text save/detail, persistence, search, Settings, model fallback visibility, and export/import surface presence, and the 2026-06-18 development-client pass covers the revised New memory typed-save flow, but not every target workflow.
2. Run device-level speech QA across iOS, Android, and web voice flows, including audible Android transcription, long pauses, hold-to-speak behavior, interruption recovery, and accepted/denied permission paths.
3. Run device QA for archive-at-rest encryption migration, unlock, and plaintext cleanup on Pixel 8a.
4. Run Markdown import preview/apply QA with selected artifacts, biometric app-lock QA, and archive-at-rest migration/unlock QA on Pixel 8a.
5. Run Qwen and BGE local-model asset QA on target hardware.
6. Run WebDAV encrypted sync device QA.
7. Run broader device QA across mobile, tablet, and web.
8. Keep disposable test screenshots in `.codex-screenshots/<task-name>/` and clean them with `npm run screenshots:cleanup -- --dir .codex-screenshots/<task-name> --yes`; keep only durable QA evidence under `docs/`.

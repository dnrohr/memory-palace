# Memory Palace Roadmap

Last updated: 2026-06-13

Memory Palace is an offline-first, cross-platform memory archive. The durable product is the local text archive, structured metadata, user-confirmed tags, search index, timeline, life-context graph, and exportable data. AI features must remain modular, optional, local-first where possible, and unable to corrupt canonical user data without confirmation.

## Status Snapshot

| Phase | Milestones | Status |
| --- | --- | --- |
| Phase 1: Useful Without AI | 1-4 | In progress |
| Phase 2: Personal Intelligence | 5-7 | In progress |
| Phase 3: Exploration and Durability | 8-10 | In progress |
| Phase 4: Optional Expansion | 11-12 | In progress |

## Remaining Work At A Glance

### Ready to Continue Locally

- None currently. The Pixel 8 development-build workflow, local verification script, and result template are in place.
- The current app still needs the full physical Pixel 8 major-change gate before mobile-facing milestones can be treated as target-device verified. A partial Pixel 8a development-build run is recorded in `docs/pixel-8-results/2026-06-13-pixel-8a-partial.md`.
- A follow-up Pixel 8a development-build attempt is recorded in `docs/pixel-8-results/2026-06-13-pixel-8a-dev-client-connection.md`: local verification and preflight passed, the debug APK assembled and installed, and Metro bundled Android JS, but the Expo development launcher reported an `unexpected end of stream` before the app UI could be exercised.
- Archive-at-rest encryption is now wired through the Settings save flow on web: enabling archive scope requires an archive passphrase, writes the encrypted local archive, clears plaintext primary storage, and reloads into the archive unlock screen. Web round-trip evidence is recorded in `docs/encryption-qa-results/2026-06-13-web-archive-at-rest.md`; native device QA remains open.

### Needs Model Runtime Wiring Or Device QA

- Milestone 6: production structured-extraction target selected as `Qwen2.5-0.5B-Instruct` through `llama.rn`; portable runtime adapter, checked asset manifest, guarded engine factory, and Expo document-storage asset discovery are present. Native runtime loading plus device QA remain.
- Milestone 7: production embedding target selected as `BAAI/bge-small-en-v1.5` through ONNX Runtime; portable BGE adapter, checked asset manifest, guarded engine factory, and Expo document-storage asset discovery are present. Native/web runtime loading plus device QA remain.
- Milestone 11: WebDAV encrypted sync is the first production sync provider target; device QA remains before treating it as complete.

### Needs Device QA

- Run the Pixel 8 development-build checklist for the current app and record results in `docs/pixel-8-results/`.
- Milestone 1: mobile/tablet/web smoke QA on real target devices.
- Milestone 2: device-level search and keyboard QA.
- Milestone 3: iOS, Android, and full web speech-recognition QA, including accepted permission prompts, background interruption, and transcription fallback. Web denied-permission fallback evidence is recorded in `docs/speech-qa-results/2026-06-13-web-denied-permission.md`.

## Major Change Test Gate

Major changes must pass the normal local checks and a Pixel 8 device check before they are considered complete.

- Local gate: `npm test` and `npm run build`.
- Device gate: run the app on the Pixel 8 development build, exercise the affected workflow, and confirm startup, navigation, persistence, and visible error handling still work.
- Required for: native mobile setup, SQLite/storage migrations, archive encryption/unlock, app lock, speech/audio capture, import/export, sync/backup, navigation shell changes, and major UI flows.
- Deferral rule: if Pixel 8 testing is not possible, record the blocker in the implementation log and keep the affected work marked as needing device QA.

## Implementation Log

### 2026-06-13

- Promoted Pixel 8 testing to the top implementation priority: use an Expo development build, repeatable phone-start scripts, and a device-testing runbook rather than relying on Expo Go for the main app.
- Added a major-change test gate requiring Pixel 8 development-build QA for substantial mobile, storage, encryption, speech, sync, navigation, and data-model changes before they are considered complete.
- Added `expo-dev-client`, Pixel 8 start/build scripts, and `PIXEL_8_TEST.md` so Android device QA has a repeatable development-build path.
- Added `npm run verify` and a Pixel 8 result template so the local gate and device evidence can be recorded consistently for major changes.
- Added `npm run pixel8:preflight` to check Pixel 8 QA readiness before build/install: required scripts/docs, `adb` availability, and ADB-visible Android devices.
- Made additive SQLite migrations idempotent when the latest schema already contains the target columns, reducing device-test failures on fresh or partially migrated local databases.
- Added a visible archive-load failure state with retry so startup storage errors do not leave the app stuck on an indefinite loading screen.
- Recorded the current-app Pixel 8 gate status in `docs/pixel-8-results/2026-06-13-current-app-deferred.md`: local verification passed, but physical Pixel 8 QA remains deferred because this environment has no attached device.
- Ran the Pixel 8 preflight locally; it failed with the actionable blocker that `adb` is not available on PATH in this environment.
- Added a GitHub Actions `Verify` workflow so the documented local gate (`npm ci` and `npm run verify`) runs on pushes to `main` and pull requests.
- Rechecked the Pixel 8 blocker: `adb` is not on PATH, no standard Windows Android SDK `adb.exe` path is present, and no physical Pixel 8 is attached in this environment.
- Added a UI polish batch from `UI_DESIGN_DOCUMENT.md`: wide Explore now uses a two-pane composition, theme shelves use a reusable `ThemeClusterCard`, and core Settings trust/control areas use a reusable `SettingsSection` surface.
- Ran `npm run verify` for the UI polish batch; build, all 102 tests, and Expo public config passed.
- Ran local web visual QA on `http://localhost:8081`: wide Explore rendered as a two-pane layout, Settings rendered the new section surfaces, mobile-width Explore stayed stacked, and no horizontal overflow or console errors appeared.
- Re-ran the Pixel 8 preflight for the UI polish batch; it still fails because `adb` is not available on PATH, so physical device QA remains deferred.
- Improved Pixel 8 device readiness automation: preflight now discovers `adb` in PATH and standard Android SDK locations, checks for a Java runtime in `JAVA_HOME`, Android Studio JBR, and common JDK folders, distinguishes ready/offline/unauthorized devices, and has helper tests.
- Replaced the interactive `pixel8:build` script with a non-interactive wrapper that selects the first ADB-ready device and wires detected Java into the Expo Android build.
- Ran a partial physical-device development-build QA pass on an attached Pixel 8a running Android 16: preflight passed, the debug APK built/installed, the app bundle loaded through the dev client, Explore rendered, a text memory saved to detail, the saved memory reappeared after reconnecting post-restart, Settings rendered, and search field/keyboard focus worked. Full Pixel 8 target-device QA remains open.
- Re-ran the current-app Pixel 8 gate on the available Pixel 8a: `npm run verify` and `npm run pixel8:preflight` passed, direct Gradle debug assembly and `adb install -r` passed, and Metro completed Android bundles. Full workflow QA remains deferred because the Expo development launcher reported `unexpected end of stream` when connecting to the local Metro server, and exact Pixel 8 hardware was not attached.
- Ran web speech denied-permission QA on `http://localhost:8092`: New Memory and Voice rendered, no-audio-retention copy and ready status were visible, starting recording produced a visible `Microphone permission was denied.` state with a `Try again` recovery action, and no browser console errors appeared beyond existing style warnings. Accepted-microphone, iOS, Android native, and exact Pixel 8 speech QA remain open.
- Wired archive-at-rest encryption into the Settings save flow: archive scope with user passphrase now requires a one-time archive passphrase, immediately writes the encrypted archive, clears plaintext primary storage, and disabling archive scope writes the current archive back to primary storage while clearing the encrypted record and in-memory archive passphrase.
- Ran archive-at-rest web QA on `http://localhost:8093`: Settings showed the archive passphrase migration field, saving with a test passphrase showed encrypted-archive success copy, reload displayed the encrypted archive unlock screen, unlocking returned to Explore, and no console errors appeared beyond existing style warnings.
- Ran `npm run verify` and `npm run pixel8:preflight` for the archive-at-rest Settings migration slice; both passed. Physical archive-at-rest device QA remains deferred because the available Pixel 8a development client did not complete the Metro connection in the prior device pass, and exact Pixel 8 hardware is not attached.
- Selected production local model targets in `docs/model-selection.md`: BGE small English v1.5 for embeddings, Qwen2.5 0.5B Instruct through a llama.cpp-compatible runtime for optional structured extraction, and WebDAV encrypted sync as the first production sync target.
- Added a BGE small English v1.5 ONNX embedding adapter with model metadata, query/passage prefix handling, masked mean pooling for token embeddings, and tests for the production embedding target. Hash embeddings remain the runtime fallback until model assets and device QA are wired.
- Added a Qwen2.5 0.5B Instruct structured-extraction adapter for `llama.rn`, with chat prompt wrapping, deterministic local completion settings, optional grammar forwarding, and validation through the existing JSON structured-extraction contract. Rules remain the default until model assets and device QA are wired.
- Added a tracked `patch-package` patch for `onnxruntime-react-native@1.24.3` so its Android Gradle script works under the current Gradle toolchain, ignored generated `llama.rn` Hexagon asset sync output, and confirmed direct Android debug assembly succeeds after adding the local model runtime dependencies.
- Installed the local-model-runtime debug APK on the attached Pixel 8a successfully; partial device evidence is recorded in `docs/pixel-8-results/2026-06-13-local-model-runtime-install.md`. Full exact Pixel 8 model runtime QA remains open until model assets and dev-client workflow testing are complete.
- Added checked local-model asset manifests and guarded engine factories for BGE small English v1.5 and Qwen2.5 0.5B Instruct, so production local engines are created only when required asset files resolve and the app can keep using hash/rules fallbacks when files are absent.
- Added Expo document-storage model asset discovery and Settings visibility for optional BGE/Qwen model files, including a refresh action and fallback status when required files are absent.

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

Remaining:
- Full target Pixel 8 device-level QA.

### 2. Manual Tags and Basic Search

Status: In progress

Done:
- Manual tag assignment, readable theme shelves, tag management, filters, tag type editing, and tag merge UI/operations.
- Basic search, ranked portable search snippets, keyword highlighting, and matched-tag labels.
- Active-search summaries, clearer keyword/nearby result headings, empty-state guidance, timeline v1, and native SQLite FTS rebuild/query integration.
- Partial Pixel 8a keyboard/search-field focus evidence.

Remaining:
- Full device-level search result and keyboard QA.

### 3. Voice Capture and Transcription

Status: In progress

Done:
- Transcription contract, manual-text fallback, audio capture wrapper, microphone permission handling, and typed recording errors.
- Capture status/retry states, private-listening voice UI, transcript draft flow, optional `expo-speech-recognition` native speech-to-text adapter, and native speech permissions config.
- Editable manual fallback on recognition errors and AppState interruption/background handling.

Remaining:
- Device-level speech QA.

### 4. Rules-Based Metadata Suggestions

Status: Done

Done:
- Date/tag suggestion prototypes, broader month/year and everyday-theme rules, review inbox generation, and review UI with source/explanation provenance.
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
- Settings controls for local rules extraction.
- Production target selected as `Qwen2.5-0.5B-Instruct`, with a Qwen/`llama.rn` adapter, checked GGUF asset manifest, optional grammar asset support, guarded engine factory, and Expo document-storage asset discovery.

Remaining:
- Native `llama.rn` asset URI loading, runtime initialization, and device QA.

### 7. Semantic Search and Embeddings

Status: In progress

Done:
- Embedding interface, no-op engine, hash embedding engine, local embedding model adapter, semantic search, and related memories.
- Embedding storage schema, persistent vectors, stale detection, queue visibility, index rebuild/search helpers, semantic search UI, manual regeneration control, and automatic/manual embedding maintenance controls.
- Production target selected as `BAAI/bge-small-en-v1.5`, with a BGE-specific ONNX adapter, checked ONNX/tokenizer asset manifest, guarded engine factory, and Expo document-storage asset discovery.

Remaining:
- Native/web runtime loading for ONNX sessions and tokenizer instances, plus device QA.

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
- Compact Settings trust cards and visually separated advanced diagnostics.

Remaining:
- Device QA for app lock, encrypted exports, encrypted backup, and archive-at-rest unlock/migration paths.

### 11. Optional Cloud and Sync Layer

Status: In progress

Done:
- Sync provider contract, disabled no-sync provider, conflict shape, and opt-in encrypted backup/sync provider backed by the archive-at-rest adapter.
- WebDAV encrypted sync provider target, Settings UI for local encrypted backup sync with an explicit passphrase, and Settings UI for explicit WebDAV URL/credentials/passphrase sync.

Remaining:
- Device QA for WebDAV sync and any cloud-AI adapters behind explicit consent.

### 12. Product Refinement and Habit Formation

Status: Done

Done:
- Review inbox data/UI, quiet optional-review surface with accept/edit/dismiss/defer actions, gentle resurfacing prompt data/UI, private voice-capture polish, related-memory prompts, memory addendum flow, durable private notes, fast capture mode, and memory split/merge flows.
- Explore-first header, bottom navigation with central capture, Explore path cards including unknown dates, readable theme shelves, continue-from language, lower-pressure new-memory capture, warmer private-notebook capture styling, clearer `Ways in` hierarchy, and low-saturation varied path cards.
- Post-save suggestion sheet, museum-label memory detail composition, original-memory reading panel, constellation-style entity cards, possible/accepted chapter card polish, explicit back-to-Explore affordances, persisted light/dark appearance, shared app-shell, screen-header, center-capture, breadcrumb, memory-card, tag-pill, date-certainty, connection-reason, review-card, entity-card, and chapter-card UI primitives, Settings information architecture and trust-card polish, emotional-safety controls for sensitive/excluded memories, calmer search/review wording, and responsive shell polish.
- Wide Explore two-pane layout, reusable `ThemeClusterCard`, and reusable `SettingsSection` surfaces for calmer desktop/tablet browsing and trust controls.

Remaining:
- None.

## Design North Star

Memory Palace should feel like a private notebook at capture time, an archive box for storage and trust, a museum label on memory detail screens, and a quiet memory palace during exploration.

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

## Next Implementation Priorities

1. Run the Pixel 8 major-change gate on the current app: startup, navigation, SQLite persistence, archive loading errors, voice capture fallback, settings, export/import, and encryption surfaces.
2. Run device-level speech QA across iOS, Android, and web voice flows.
3. Run device QA for archive-at-rest encryption migration, unlock, and plaintext cleanup on exact Pixel 8 hardware.
4. Add native/web runtime loaders for the selected BGE and Qwen model assets, then keep hash/rules fallbacks active until device QA passes.
5. Run WebDAV encrypted sync device QA.
6. Run broader device QA across mobile, tablet, and web.

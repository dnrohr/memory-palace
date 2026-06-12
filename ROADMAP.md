# Memory Palace Roadmap

Last updated: 2026-06-12

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

- None currently. Remaining work depends on device QA or explicit model/provider choices.

### Needs Model or Provider Selection

- Milestone 6: select the production local structured-extraction model/runtime and run device QA.
- Milestone 7: select the production local embedding model/runtime and run device QA.
- Milestone 11: wire real cloud AI or cloud sync adapters only after explicit provider targets and consent boundaries are selected.

### Needs Device QA

- Milestone 1: mobile/tablet/web smoke QA on real target devices.
- Milestone 2: device-level search and keyboard QA.
- Milestone 3: iOS, Android, and web speech-recognition QA, including permission prompts, background interruption, and transcription fallback.

## Implementation Log

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

Remaining:
- Device-level QA.

### 2. Manual Tags and Basic Search

Status: In progress

Done:
- Manual tag assignment, readable theme shelves, tag management, filters, tag type editing, and tag merge UI/operations.
- Basic search, ranked portable search snippets, keyword highlighting, and matched-tag labels.
- Active-search summaries, clearer keyword/nearby result headings, empty-state guidance, timeline v1, and native SQLite FTS rebuild/query integration.

Remaining:
- Device-level search and keyboard QA.

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

Remaining:
- Production local model/runtime selection and device QA.

### 7. Semantic Search and Embeddings

Status: In progress

Done:
- Embedding interface, no-op engine, hash embedding engine, local embedding model adapter, semantic search, and related memories.
- Embedding storage schema, persistent vectors, stale detection, queue visibility, index rebuild/search helpers, semantic search UI, manual regeneration control, and automatic/manual embedding maintenance controls.

Remaining:
- Production local embedding model/runtime selection and device QA.

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
- Post-save suggestion sheet, museum-label memory detail composition, original-memory reading panel, constellation-style entity cards, possible/accepted chapter card polish, explicit back-to-Explore affordances, persisted light/dark appearance, shared date-certainty and connection-reason UI primitives, Settings information architecture and trust-card polish, emotional-safety controls for sensitive/excluded memories, calmer search/review wording, and responsive shell polish.

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

1. Run device-level speech QA across iOS, Android, and web voice flows.
2. Wire archive-at-rest encryption into native/web storage with unlock, key lifecycle, and migration UI.
3. Add production local embedding/model adapters when target models are selected.
4. Add opt-in sync/backup provider adapters when provider targets are selected.
5. Run device-level QA across mobile, tablet, and web.

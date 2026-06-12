# Memory Palace Roadmap

Last updated: 2026-06-11

Memory Palace is an offline-first, cross-platform memory archive. The durable product is the local text archive, structured metadata, user-confirmed tags, search index, timeline, life-context graph, and exportable data. AI features must remain modular, optional, local-first where possible, and unable to corrupt canonical user data without confirmation.

## Status Snapshot

| Phase | Milestones | Status |
| --- | --- | --- |
| Phase 1: Useful Without AI | 1-4 | In progress |
| Phase 2: Personal Intelligence | 5-7 | In progress |
| Phase 3: Exploration and Durability | 8-10 | In progress |
| Phase 4: Optional Expansion | 11-12 | In progress |

## Implementation Log

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

## Milestone Status

| Milestone | Status | Done | Remaining |
| --- | --- | --- | --- |
| 1. Product Skeleton and Local Database | In progress | App shell, CRUD, export, restore, permanent delete, native SQLite path, web fallback, migration tracking, richer settings, storage diagnostics. | Device-level QA. |
| 2. Manual Tags and Basic Search | In progress | Manual tag assignment, tag management, filters, tag type editing/merge UI and operations, basic search, ranked portable search snippets, keyword highlighting, matched-tag labels, timeline v1, native SQLite FTS rebuild/query integration. | Search polish and device-level QA. |
| 3. Voice Capture and Transcription | In progress | Transcription contract, manual-text fallback, audio capture wrapper, microphone permission handling, typed recording errors, capture status/retry states, transcript draft flow. | Native speech-to-text adapter and interruption/background handling. |
| 4. Rules-Based Metadata Suggestions | Done | Date/tag suggestion prototypes, broader month/year and everyday-theme rules, review inbox generation, review UI with source/explanation provenance, accept/reject actions, rejected-tag feedback for future suggestions. | None. |
| 5. Life Context Graph | In progress | People, pets, places, and life-period schema/types, app management UI, basic text matcher, graph nodes and memory-context edges. | Relationship edges, inference rules, and richer graph traversal. |
| 6. Local Structured Extraction Model | In progress | Structured extraction interface, no-op engine, local rules-backed extraction engine, schema validation, prompt/version metadata, Settings controls for local rules extraction. | Local model adapter. |
| 7. Semantic Search and Embeddings | In progress | Embedding interface, no-op engine, hash embedding engine, semantic search, related memories, embedding storage schema, persistent vectors, stale detection, queue visibility, index rebuild/search helpers, semantic search UI, manual regeneration control, automatic/manual embedding maintenance controls. | Production local embedding model. |
| 8. Timeline and Memory Visualization | In progress | Timeline v1, timeline date certainty/range cues, richer timeline filtering, tag graph summary UI, shared-tag cluster UI, editable life chapter candidate UI, persisted chapter rename/reject actions, related memories. | Cluster/chapter merge/split actions. |
| 9. Import, Export, and Data Portability | In progress | JSON/Markdown export providers, SQLite SQL dump export, backup manifest, JSON/Markdown import providers, platform file export/import preview/apply UI, duplicate detection, conflict preview details, archive merge behavior, user-selectable import conflict resolution. | Folder-style Markdown bundle import/export. |
| 10. Privacy, Security, and Trust | In progress | Local processing disclosure, deleted-memory controls, archive audit counts, data audit report, storage estimates, processing-log cleanup, retained-audio reference cleanup, deleted-artifact cleanup for audio references and stale embeddings, app-lock contract, Expo biometric lock provider and UI, SecureStore-backed PIN lock, encryption options contract/UI. | Production encryption adapter. |
| 11. Optional Cloud and Sync Layer | In progress | Sync provider contract, disabled no-sync provider, conflict shape. | Opt-in provider adapters, encrypted backup/sync, cloud-AI adapters behind explicit consent. |
| 12. Product Refinement and Habit Formation | In progress | Review inbox data/UI, gentle resurfacing prompt data/UI, related-memory prompts, memory addendum flow, fast capture mode, memory split/merge flows. | Richer correction/private-note fields and editing polish. |

## Product Principles

- Offline-first and private by default.
- No required subscription, cloud inference, cloud storage, or agent tokens.
- Keep raw memory text; never overwrite it with model output.
- User-confirmed metadata wins over imported, inferred, rule-based, model, or cloud suggestions.
- All replaceable capabilities sit behind interfaces: transcription, structured extraction, embeddings, search, sync, export/import, visualization, and security.
- Export must remain boring and durable: JSON, Markdown, and eventually SQLite.

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

1. Add native speech-to-text adapter behind `ITranscriptionEngine`.
2. Add cluster/chapter merge and split actions.
3. Add user-selectable import conflict resolution.
4. Add encryption options and stronger deletion guarantees.
5. Add native speech-to-text adapter and interruption/background handling.
6. Add production local embedding/model adapters when target models are selected.

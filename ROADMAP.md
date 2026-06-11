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

## Milestone Status

| Milestone | Status | Done | Remaining |
| --- | --- | --- | --- |
| 1. Product Skeleton and Local Database | In progress | App shell, CRUD, export, restore, permanent delete, native SQLite path, web fallback, migration tracking. | Richer settings, storage diagnostics, device-level QA. |
| 2. Manual Tags and Basic Search | In progress | Manual tag assignment, tag management, filters, tag type editing/merge operations, basic search, ranked portable search, timeline v1. | FTS-backed search, app UI for merge/type editing, stronger search highlighting. |
| 3. Voice Capture and Transcription | In progress | Transcription contract, manual-text fallback, audio capture wrapper, microphone permission handling, transcript draft flow. | Native speech-to-text adapter, interruption/background handling, deeper recording error states. |
| 4. Rules-Based Metadata Suggestions | In progress | Date/tag suggestion prototypes, review inbox generation, review UI, accept/reject actions. | Richer provenance UI, broader rules, feedback from rejected suggestions. |
| 5. Life Context Graph | In progress | People, pets, places, and life-period schema/types, app management UI, basic text matcher. | Relationship graph edges, inference rules, graph traversal. |
| 6. Local Structured Extraction Model | In progress | Structured extraction interface, no-op engine, local rules-backed extraction engine. | Local model adapter, schema validation, prompt/version metadata, UI controls. |
| 7. Semantic Search and Embeddings | In progress | Embedding interface, no-op engine, hash embedding engine, semantic search, related memories, embedding storage schema, persistent vectors, stale detection, index rebuild/search helpers, semantic search UI. | Production local embedding model, background indexing queue, explicit regeneration controls. |
| 8. Timeline and Memory Visualization | In progress | Timeline v1, timeline date certainty/range cues, tag graph summary UI, shared-tag cluster UI, editable life chapter candidate UI, related memories. | Cluster/chapter rename/merge/reject actions, richer timeline filtering. |
| 9. Import, Export, and Data Portability | In progress | JSON/Markdown export providers, backup manifest, JSON/Markdown import providers, platform file export/import preview/apply UI, duplicate detection, archive merge behavior. | SQLite export, richer conflict resolution, folder-style Markdown bundle import/export. |
| 10. Privacy, Security, and Trust | In progress | Local processing disclosure, deleted-memory controls, archive audit counts, data audit report, processing-log cleanup, retained-audio reference cleanup, app-lock contract, Expo biometric lock provider and UI. | Secure PIN provider, richer storage sizing, deletion guarantees for model files/audio files, encryption options. |
| 11. Optional Cloud and Sync Layer | In progress | Sync provider contract, disabled no-sync provider, conflict shape. | Opt-in provider adapters, encrypted backup/sync, cloud-AI adapters behind explicit consent. |
| 12. Product Refinement and Habit Formation | In progress | Review inbox data/UI, gentle resurfacing prompt data/UI, related-memory prompts. | Fast capture mode, memory split/merge/addendum/correction flows, editing polish. |

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
2. Add FTS-backed search adapter while keeping the portable ranked search fallback.
3. Add background queue controls and explicit regeneration for stale embeddings.
4. Add cluster/chapter rename, merge, split, and reject actions.
5. Add SQLite export and richer import conflict resolution.
6. Add secure PIN lock and encryption options.

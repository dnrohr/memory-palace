# Memory Palace Roadmap

## Status Snapshot

Last updated: 2026-06-11

| Phase | Milestones | Status |
| --- | --- | --- |
| Phase 1: Useful Without AI | 1-4 | In progress |
| Phase 2: Personal Intelligence | 5-7 | Not started |
| Phase 3: Exploration and Durability | 8-10 | Not started |
| Phase 4: Optional Expansion | 11-12 | Not started |

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

## Milestone Status

| Milestone | Status | Notes |
| --- | --- | --- |
| 1. Product Skeleton and Local Database | Partial | App shell, CRUD, export, restore, permanent delete, native SQLite path, and migration tracking exist. Richer settings remain. |
| 2. Manual Tags and Basic Search | In progress | Manual tag assignment, tag management, filters, tag type editing/merge operations, basic search, ranked portable search, and timeline v1 exist. FTS-backed search and app UI for merge/type editing remain. |
| 3. Voice Capture and Transcription | In progress | Transcription contract and manual-text fallback exist. Needs audio capture, permissions, native speech adapter, and transcript draft flow. |
| 4. Rules-Based Metadata Suggestions | In progress | Date/tag suggestion prototypes, review inbox generation, and review UI exist. Needs accept/reject actions, provenance UI, and broader rules. |
| 5. Life Context Graph | In progress | People, pets, places, and life-period schema/types, app management UI, and a basic text matcher exist. Needs relationship graph edges, inference rules, and graph traversal. |
| 6. Local Structured Extraction Model | In progress | Structured extraction interface and no-op local engine exist. Needs local model adapter, schema validation, prompt/version metadata, and UI controls. |
| 7. Semantic Search and Embeddings | In progress | Embedding interface, no-op engine, and storage schema exist. Needs local embedding model, indexing queue, nearest-neighbor search, and semantic UI. |
| 8. Timeline and Memory Visualization | In progress | Timeline v1, tag graph data, shared-tag cluster data, and editable life chapter candidates exist. Needs timeline v2 UI, graph UI, and cluster/chapter editing UI. |
| 9. Import, Export, and Data Portability | In progress | JSON/Markdown export providers, backup manifest, JSON/Markdown import preview providers, duplicate detection, and archive merge behavior exist. Needs file save/import UX, SQLite export, and richer conflict resolution. |
| 10. Privacy, Security, and Trust | In progress | Local processing disclosure, deleted-memory controls, archive audit counts, and app-lock contract exist. Needs native PIN/biometric provider, storage sizing, deletion guarantees for model/audio artifacts, and encryption options. |
| 11. Optional Cloud and Sync Layer | In progress | Sync provider contract, disabled no-sync provider, and conflict shape exist. Cloud/sync providers remain deferred and opt-in. |
| 12. Product Refinement and Habit Formation | In progress | Review inbox data/UI and gentle resurfacing prompts exist. Needs fast capture, prompt UI, and editing polish. |

## Original Product Plan

The original product plan is preserved below. As implementation progresses, update the status snapshot and milestone table above with each major change.

---

# Memory Journal Development Roadmap
0. Product Definition
0.1 Core Concept
Memory Journal is an offline-first mobile app for capturing, organizing, searching, and visualizing personal memories.
The core interaction:
User opens app.
User taps New Memory.
User speaks or types a memory.
App converts speech to text.
App suggests dates, tags, people, places, pets, objects, themes, and emotional tones.
User confirms or edits suggestions.
Memory is stored locally.
Memories become searchable, filterable, clusterable, and visualizable.
0.2 Primary Product Principle
The durable product is not the LLM.
The durable product is:
Local text archive
Structured metadata
User-confirmed tags
Search index
Timeline
Life-context graph
Exportable data
AI components should be modular, replaceable, and nonessential to data integrity.
0.3 Core Design Goals
Offline-first
Private by default
No required subscription
No required cloud inference
No required agent tokens
Modular AI pipeline
Exportable data
User-confirmed metadata
Graceful degradation without AI
Small enough to run on a 2026 smartphone
Usable even with only rules-based tagging
---
1. High-Level Architecture
1.1 System Overview
```text
Mobile App UI
  |
  v
Capture Module
  - Audio recorder
  - Text editor
  - Draft manager
  |
  v
Transcription Module
  - Native speech-to-text
  - Optional local transcription engine
  - Optional cloud transcription adapter
  |
  v
Memory Processing Pipeline
  - Text cleanup
  - Date extraction
  - Entity extraction
  - Tag suggestion
  - Life-context inference
  - Optional local LLM extraction
  - Optional embedding generation
  |
  v
User Confirmation Layer
  - Suggested title
  - Suggested dates
  - Suggested tags
  - Suggested related memories
  |
  v
Local Persistence Layer
  - SQLite canonical database
  - FTS search index
  - Tag tables
  - Life-context tables
  - Optional vector index
  |
  v
Retrieval and Visualization Layer
  - Search
  - Filters
  - Timeline
  - Tag graph
  - Memory clusters
  - Life chapters
```
1.2 Modularity Principle
Every major capability should sit behind an interface.
Examples:
```text
ITranscriptionEngine
ITagSuggestionEngine
IDateInferenceEngine
IEmbeddingEngine
ILLMExtractionEngine
ISearchIndex
IVectorStore
IExportProvider
IImportProvider
IVisualizationProvider
```
The app should be able to swap:
Apple Speech ↔ Whisper.cpp ↔ cloud STT
Gemma ↔ Phi ↔ rules-only extractor
SQLite FTS ↔ Tantivy/Lucene-style search
Local embeddings ↔ no embeddings ↔ cloud embeddings
Native UI ↔ Flutter ↔ React Native
Local-only storage ↔ encrypted sync later
---
2. Recommended Initial Tech Stack
2.1 MVP Stack
Recommended MVP:
```text
App framework: Flutter or React Native
Database: SQLite
Search: SQLite FTS5
Speech-to-text: Native platform APIs
AI v1: Rules-based extraction
AI v2: Optional local structured-extraction model
Embeddings: Deferred until after MVP
Sync: Deferred
Cloud: None required
```
2.2 Native vs Cross-Platform Recommendation
Option A: Flutter / React Native MVP
Best for:
Fast iteration
Shared UI
Quicker prototyping
Easier product validation
Tradeoff:
On-device AI integrations may need native bridges.
Platform-specific speech behavior may be uneven.
Option B: Native iOS + Native Android
Best for:
Best OS integration
Best local speech support
Better performance
Better local model integration
Better privacy/security polish
Tradeoff:
More engineering work
Two codebases
Practical Recommendation
Start with:
```text
Flutter or React Native for MVP
Native modules for:
  - speech
  - local model inference
  - secure storage
  - background indexing
```
If the app proves worthwhile, migrate performance-critical modules into native code behind stable interfaces.
---
3. Data Model
3.1 Canonical Entities
Memory
A memory is the core object.
```sql
memory
- id TEXT PRIMARY KEY
- raw_text TEXT NOT NULL
- cleaned_text TEXT
- title TEXT
- summary TEXT
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL
- captured_at DATETIME
- source_type TEXT
  -- voice | typed | import | edit
- audio_uri TEXT NULL
- is_audio_retained BOOLEAN DEFAULT FALSE
- approximate_start_date TEXT NULL
- approximate_end_date TEXT NULL
- date_precision TEXT
  -- exact | day | month | year | range | age | grade | decade | unknown
- date_confidence REAL
- date_explanation TEXT
- user_date_confirmed BOOLEAN DEFAULT FALSE
- deleted_at DATETIME NULL
```
Tag
```sql
tag
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- normalized_name TEXT NOT NULL
- type TEXT
  -- person | pet | place | time | object | emotion | theme | activity | life_period | custom
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL
- is_user_created BOOLEAN DEFAULT FALSE
```
Memory Tag Join
```sql
memory_tag
- memory_id TEXT NOT NULL
- tag_id TEXT NOT NULL
- source TEXT
  -- explicit_text | inferred | user_added | model_suggested | imported
- confidence REAL
- user_confirmed BOOLEAN DEFAULT FALSE
- rejected BOOLEAN DEFAULT FALSE
- created_at DATETIME NOT NULL
PRIMARY KEY(memory_id, tag_id)
```
Person
```sql
person
- id TEXT PRIMARY KEY
- display_name TEXT NOT NULL
- normalized_name TEXT NOT NULL
- relationship TEXT NULL
  -- parent | sibling | friend | child | spouse | teacher | etc.
- notes TEXT
- created_at DATETIME NOT NULL
```
Pet
```sql
pet
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- species TEXT NULL
- breed TEXT NULL
- approximate_start_date TEXT NULL
- approximate_end_date TEXT NULL
- notes TEXT
```
Place
```sql
place
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- type TEXT
  -- house | apartment | school | workplace | town | landmark | vague_place
- approximate_start_date TEXT NULL
- approximate_end_date TEXT NULL
- latitude REAL NULL
- longitude REAL NULL
- privacy_level TEXT
  -- exact | approximate | vague | hidden
- notes TEXT
```
Life Period
```sql
life_period
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
  -- 4th grade, college, first apartment, Boston years, etc.
- start_date TEXT NULL
- end_date TEXT NULL
- date_precision TEXT
- notes TEXT
```
User Profile Context
```sql
user_profile
- id TEXT PRIMARY KEY
- birth_year INTEGER NULL
- birth_month INTEGER NULL
- birth_day INTEGER NULL
- preferred_date_precision TEXT
- allow_inferred_dates BOOLEAN DEFAULT TRUE
- allow_emotion_detection BOOLEAN DEFAULT TRUE
- allow_audio_retention BOOLEAN DEFAULT FALSE
```
Model Metadata
```sql
processing_run
- id TEXT PRIMARY KEY
- memory_id TEXT NOT NULL
- processor_name TEXT NOT NULL
- processor_version TEXT NOT NULL
- input_hash TEXT NOT NULL
- output_json TEXT NOT NULL
- created_at DATETIME NOT NULL
```
This table is important because model outputs may change over time. You want reproducibility and debuggability.
---
4. Module Boundaries
4.1 Capture Module
Responsibilities
Record audio
Pause/resume recording
Cancel draft
Save draft
Pass audio to transcription
Allow manual text entry
Handle interrupted sessions
Interface
```typescript
interface ICaptureService {
  startRecording(): Promise<CaptureSession>;
  pauseRecording(sessionId: string): Promise<void>;
  resumeRecording(sessionId: string): Promise<void>;
  stopRecording(sessionId: string): Promise<AudioArtifact>;
  discardRecording(sessionId: string): Promise<void>;
}
```
Swappable Components
Native iOS recorder
Native Android recorder
Cross-platform recorder
Future wearable recorder
Future voice memo import
---
4.2 Transcription Module
Responsibilities
Convert audio to text
Return confidence where available
Return timestamps if available
Support offline mode
Support fallback engines
Interface
```typescript
interface ITranscriptionEngine {
  id: string;
  displayName: string;
  supportsOffline: boolean;
  supportsTimestamps: boolean;

  transcribe(input: AudioArtifact): Promise<TranscriptionResult>;
}
```
Result Shape
```typescript
type TranscriptionResult = {
  text: string;
  segments?: TranscriptionSegment[];
  confidence?: number;
  engineId: string;
  engineVersion: string;
  language?: string;
};
```
Engine Options
Initial:
```text
NativeSpeechTranscriptionEngine
```
Future:
```text
WhisperCppTranscriptionEngine
VoskTranscriptionEngine
CloudTranscriptionEngine
ManualTextEngine
```
MVP Choice
Use native platform speech APIs first.
Do not bundle a large speech model until product value is validated.
---
4.3 Text Cleanup Module
Responsibilities
Fix obvious speech-to-text artifacts
Preserve original transcript
Normalize punctuation
Remove duplicate filler words optionally
Generate clean display text
Interface
```typescript
interface ITextCleanupEngine {
  clean(input: string, options: TextCleanupOptions): Promise<TextCleanupResult>;
}
```
Cleanup Should Be Conservative
Bad cleanup can damage autobiographical data.
Keep:
`raw_text`
`cleaned_text`
optional diff
Never overwrite raw transcript.
---
4.4 Date Extraction Module
Responsibilities
Extract explicit and implicit time references.
Examples:
```text
"1994"
"when I was eight"
"in 4th grade"
"before we moved"
"after my daughter was born"
"the summer after college"
"during COVID"
```
Interface
```typescript
interface IDateExtractionEngine {
  extractDates(
    text: string,
    context: LifeContext
  ): Promise<DateExtractionResult>;
}
```
Output
```typescript
type DateExtractionResult = {
  candidates: DateCandidate[];
};

type DateCandidate = {
  label: string;
  startDate?: string;
  endDate?: string;
  precision: "exact" | "day" | "month" | "year" | "range" | "age" | "grade" | "decade" | "unknown";
  confidence: number;
  sourceText: string;
  inferenceExplanation?: string;
};
```
MVP Implementation
Rules-based first.
Rules should cover:
Four-digit years
Decades
Ages
Grades
Relative phrases
Known life periods
Known residences
Known schools
Known jobs
Known family milestones
Later Implementation
Use local structured extraction model to suggest date candidates, then validate with deterministic code.
---
4.5 Entity Extraction Module
Responsibilities
Detect candidate:
People
Pets
Places
Schools
Homes
Objects
Events
Activities
Named periods
Interface
```typescript
interface IEntityExtractionEngine {
  extractEntities(
    text: string,
    context: LifeContext
  ): Promise<EntityExtractionResult>;
}
```
Output
```typescript
type EntityCandidate = {
  text: string;
  normalizedText: string;
  type: "person" | "pet" | "place" | "object" | "event" | "activity" | "unknown";
  confidence: number;
  source: "explicit" | "inferred" | "known_context" | "model";
  sourceText?: string;
};
```
MVP Implementation
Proper noun heuristic
Known entity matching
Pet/person/place dictionaries from user profile
Simple noun phrase extraction
Common family terms
Common relationship terms
Later Implementation
Local NER model
Local LLM structured extraction
User-trained nickname/entity resolution
---
4.6 Tag Suggestion Module
Responsibilities
Generate candidate tags from:
Date extraction
Entity extraction
Life context
Common themes
Repeated nouns
User tag history
Optional local LLM output
Interface
```typescript
interface ITagSuggestionEngine {
  suggestTags(
    memoryText: string,
    context: MemoryProcessingContext
  ): Promise<TagSuggestionResult>;
}
```
Output
```typescript
type TagSuggestion = {
  name: string;
  type: TagType;
  confidence: number;
  source: "explicit" | "inferred" | "model" | "user_history" | "rule";
  explanation?: string;
};
```
Important Rule
Tag suggestions should be suggestions, not silent truth.
Suggested tags should appear with states:
```text
selected by default
unselected suggestion
rejected
user-added
confirmed
```
---
4.7 Local LLM Extraction Module
Responsibilities
Perform constrained structured extraction.
It should not be responsible for storage, search, or canonical truth.
Interface
```typescript
interface IStructuredExtractionModel {
  extract(
    text: string,
    context: LifeContext,
    schema: ExtractionSchema
  ): Promise<StructuredExtractionResult>;
}
```
Prompt Pattern
```text
You are extracting metadata from a personal memory.
Return JSON only.
Do not invent facts.
Separate explicit facts from inferred facts.
Mark uncertainty clearly.
```
Example Output
```json
{
  "title": "Lila in the sunny windowsill",
  "dates": [
    {
      "label": "4th grade",
      "inferred_year_range": "1994-1995",
      "confidence": 0.72,
      "basis": "User said '4th grade'; user profile implies 4th grade around 1994-1995"
    }
  ],
  "tags": [
    { "name": "dog", "type": "theme", "source": "explicit" },
    { "name": "cat", "type": "theme", "source": "explicit" },
    { "name": "Patrick", "type": "pet", "source": "explicit" },
    { "name": "Lila", "type": "pet", "source": "explicit" },
    { "name": "old house", "type": "place", "source": "explicit" },
    { "name": "apartment", "type": "place", "source": "explicit" }
  ],
  "emotional_tone": [
    { "name": "sad", "confidence": 0.69 },
    { "name": "nostalgic", "confidence": 0.81 }
  ]
}
```
Supported Model Backends
Design adapters for:
```text
NoLLMExtractionEngine
GemmaLocalExtractionEngine
PhiLocalExtractionEngine
LlamaCppExtractionEngine
CoreMLExtractionEngine
MediaPipeLLMExtractionEngine
CloudExtractionEngine
```
MVP Position
Do not block MVP on this.
Rules-first architecture should be useful before local LLM integration.
---
4.8 Embedding Module
Responsibilities
Create semantic vectors for memories and search queries.
Interface
```typescript
interface IEmbeddingEngine {
  embedText(text: string): Promise<EmbeddingVector>;
  embedBatch(texts: string[]): Promise<EmbeddingVector[]>;
}
```
Use Cases
Semantic search
Related memories
Clustering
Life chapter generation
Duplicate detection
MVP Position
Defer until the app has enough memory entries to make semantic retrieval valuable.
Swappable Backends
```text
NoEmbeddingEngine
LocalSentenceEmbeddingEngine
OnDeviceTransformerEmbeddingEngine
CloudEmbeddingEngine
```
---
4.9 Search Module
Responsibilities
Support:
Keyword search
Tag search
Faceted search
Date range search
Semantic search later
Combined search
Interface
```typescript
interface ISearchService {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
```
Query Shape
```typescript
type SearchQuery = {
  text?: string;
  tags?: string[];
  people?: string[];
  pets?: string[];
  places?: string[];
  dateRange?: DateRange;
  datePrecision?: string[];
  semantic?: boolean;
  limit?: number;
};
```
MVP Search
SQLite FTS5
Tag filters
Date filters
Later Search
Hybrid lexical + vector retrieval
Related-memory recommendations
Query expansion using known tags
---
4.10 Visualization Module
Responsibilities
Provide visual views over stored data.
Initial visualizations:
Timeline
Tag browser
Memory list
Calendar/year view
Later visualizations:
Cluster graph
Life chapters
People/pet/place network
Emotional arc
Residence/school/job eras
Interface
```typescript
interface IVisualizationDataProvider {
  getTimelineData(filters: TimelineFilters): Promise<TimelineData>;
  getTagGraphData(filters: GraphFilters): Promise<TagGraphData>;
  getClusterData(filters: ClusterFilters): Promise<ClusterData>;
}
```
---
5. Milestone Roadmap
---
Milestone 1: Product Skeleton and Local Database
Goal
Create a functioning local journal app with manual text entry, persistent storage, and basic memory listing.
Deliverables
App shell
Local SQLite database
Memory creation screen
Memory detail screen
Memory list screen
Basic edit/delete
Export raw data as JSON
Tasks
1.1 Project Setup
Choose framework.
Create monorepo or app repo.
Set up formatting/linting.
Set up test framework.
Set up local development database.
Add environment config system.
Add feature flag system.
1.2 Database Foundation
Add SQLite integration.
Create migration system.
Create initial schema:
`memory`
`tag`
`memory_tag`
`user_profile`
`processing_run`
Add migration version table.
Add database access layer.
Add repository pattern.
1.3 Memory CRUD
Create memory manually.
Edit memory.
Delete memory.
Soft-delete memory.
Restore soft-deleted memory.
Permanently delete memory.
1.4 UI Skeleton
Home screen
New memory screen
Memory detail screen
Memory edit screen
Settings screen
Tag management screen placeholder
Search screen placeholder
1.5 Export v1
Export all memories as JSON.
Export all memories as Markdown.
Include tags if present.
Include date metadata if present.
Acceptance Criteria
User can create a text memory.
User can edit it.
User can delete it.
App can restart and memory remains.
User can export all memories.
No network required.
---
Milestone 2: Manual Tags and Basic Search
Goal
Make the journal useful without AI.
Deliverables
Manual tags
Tag management
Full-text search
Tag filters
Date fields
Basic timeline/list sorting
Tasks
2.1 Manual Tagging
Add tag creation UI.
Add tag edit UI.
Add tag delete/merge UI.
Add tag assignment on memory detail.
Add tag removal.
Add tag type selector:
person
pet
place
time
object
emotion
theme
custom
2.2 Search v1
Add SQLite FTS5 virtual table.
Index raw and cleaned text.
Rebuild index migration.
Add text search UI.
Add highlight snippets.
Add search result ranking.
Add empty-state UX.
2.3 Filters v1
Filter by tag.
Filter by tag type.
Filter by approximate date.
Filter by date precision.
Filter by source type.
2.4 Date Metadata UI
Add optional memory date field.
Add date precision selector:
exact day
month
year
decade
approximate range
unknown
Add date confidence display placeholder.
Add “date is inferred” flag.
2.5 Timeline v1
Show memories by created date.
Show memories by memory date if present.
Handle unknown dates separately.
Handle approximate dates.
Acceptance Criteria
User can search memory text.
User can tag memories manually.
User can filter by tag.
User can assign approximate dates.
Timeline view works without AI.
---
Milestone 3: Voice Capture and Transcription
Goal
Support the primary interaction: speak a memory into the app.
Deliverables
Audio recording
Native speech-to-text adapter
Draft transcript editor
Optional audio retention
Transcription error handling
Tasks
3.1 Audio Capture
Build capture UI.
Add start/stop recording.
Add pause/resume if supported.
Display recording duration.
Handle app background/interruption.
Store temporary audio file.
Delete temporary audio after transcription by default.
3.2 Transcription Interface
Define `ITranscriptionEngine`.
Implement `NativeTranscriptionEngine`.
Add transcription status:
pending
transcribing
succeeded
failed
user edited
Store transcription engine metadata.
3.3 Draft Flow
After transcription, show editable transcript.
User can save as memory.
User can discard draft.
User can re-transcribe if engine supports it.
User can keep or delete audio.
3.4 Audio Privacy Settings
Setting: retain audio never/by default/ask each time.
Setting: allow cloud transcription disabled by default.
Show whether transcription is local or external.
Add audio deletion button.
3.5 Error Handling
Microphone permission denied.
Speech recognition unavailable.
Offline transcription unavailable.
Partial transcript only.
Audio file too long.
App interrupted.
Acceptance Criteria
User can speak a memory.
App transcribes it.
User can edit transcript before saving.
App works offline where native local speech is available.
Audio is not retained unless user allows it.
---
Milestone 4: Rules-Based Metadata Suggestions
Goal
Suggest useful tags and dates without an LLM.
Deliverables
Rules-based tag suggestions
Rules-based date extraction
Known entity matching
Suggestion confirmation UI
Metadata provenance
Tasks
4.1 Suggestion Pipeline
Create pipeline:
```text
Memory text
  -> text normalization
  -> date extraction
  -> entity extraction
  -> tag candidate generation
  -> deduplication
  -> ranking
  -> user confirmation
```
4.2 Date Rule Engine
Handle:
Explicit years: `1994`
Date phrases: `in June`, `last Christmas`
Decades: `the 90s`
Ages: `when I was 8`
Grades: `in 4th grade`
Life stages:
childhood
high school
college
after college
first job
Relative anchors:
before my daughter was born
after my parents divorced
when we lived in X
4.3 User Profile Context
Add setup/edit screens for:
Birth year
Important life periods
Schools
Residences
Jobs
Family members
Pets
Important dates
Aliases/nicknames
4.4 Grade-to-Year Inference
If birth year is known, infer school grades.
Example:
```text
Birth year: 1985
4th grade: approximately 1994-1995
```
Allow user correction.
4.5 Entity Extraction Rules
Detect:
Capitalized names
Known people
Known pets
Known places
Repeated noun phrases
Family terms
Pet species
School terms
Home terms
4.6 Tag Ranking
Rank by:
Explicit mention
Known entity match
Frequency
Specificity
User tag history
Context relevance
4.7 Confirmation UI
Suggested tags should be displayed as selectable chips.
States:
```text
Suggested, selected
Suggested, unselected
Confirmed
Rejected
User-created
```
4.8 Provenance
Every suggestion should store:
```text
source
confidence
explanation
processor_version
confirmed/rejected state
```
Acceptance Criteria
Given the example memory, app suggests:
Patrick
Lila
dog
cat
pet
4th grade
1994/1995 inferred
old house
apartment
User can accept/reject/edit suggestions.
Suggestions work without an LLM.
Inferred dates are labeled.
---
Milestone 5: Life Context Graph
Goal
Allow the app to learn durable personal context and use it to improve suggestions.
Deliverables
Life-context editor
People registry
Pet registry
Place registry
Life period registry
Relationship between memories and context objects
Tasks
5.1 People Registry
Add person creation.
Add aliases.
Add relationship type.
Add approximate active period.
Link person to memories.
Merge duplicate people.
5.2 Pet Registry
Add pet creation.
Add species.
Add known dates.
Add aliases.
Link pet to memories.
Merge duplicate pets.
5.3 Place Registry
Add place creation.
Add vague/exact privacy mode.
Add approximate dates.
Add aliases.
Link place to memories.
Merge duplicate places.
5.4 Life Period Registry
Examples:
```text
4th grade
old house
college
first apartment
Boston years
pre-divorce
```
Tasks:
Create life period.
Set approximate dates.
Add aliases.
Link memories to periods.
Infer date from period.
Infer period from date.
5.5 Context-Aware Suggestions
When a memory mentions:
```text
"old house"
```
The app should suggest:
```text
old house
childhood
1992-1996, if known
related people/pets from that era
```
5.6 Conflict Handling
Example:
User says “4th grade.”
Birth-year inference suggests 1994–1995.
User manually chooses 1993.
Store both:
```text
system_inferred_date: 1994-1995
user_confirmed_date: 1993
```
User-confirmed data wins.
Acceptance Criteria
App can maintain known people, pets, places, and periods.
Suggestions improve after profile/context setup.
User can correct inferred context.
System tracks provenance and confidence.
---
Milestone 6: Local Structured Extraction Model
Goal
Add optional local LLM extraction while preserving rules-based fallback.
Deliverables
`IStructuredExtractionModel` interface
Local model adapter
JSON schema validation
Model output provenance
Feature flag
Rules + model merge logic
Tasks
6.1 Define Extraction Schema
Create strict JSON schema for:
Title
Date candidates
Tag candidates
People
Pets
Places
Objects
Themes
Emotions
Life periods
Related memory hints
6.2 Model Runtime Abstraction
Create adapters:
```text
NoModelStructuredExtractor
LocalLLMStructuredExtractor
CloudStructuredExtractor
```
Do not tie app logic to one model vendor.
6.3 Prompt Template System
Create versioned prompts.
Each prompt should have:
ID
version
schema version
max input length
expected output type
6.4 JSON Validation
Model output must be validated before use.
Invalid output should:
Be discarded
Be logged locally
Fall back to rules-based suggestions
6.5 Merge Rules
Combine:
```text
rules output
known context output
model output
user history output
```
Merge logic should:
Deduplicate tags
Prefer explicit over inferred
Prefer user-confirmed over model
Preserve model-only suggestions as lower-confidence
Never overwrite user data silently
6.6 Model Management
Add settings screen:
Enable/disable local AI
Show model name
Show model size
Delete model
Download/install model if not bundled
Choose extraction mode:
rules only
local AI
optional cloud
6.7 Performance Budget
Track:
Model size
Inference time
Battery impact
Memory usage
Thermal impact
Failure rate
6.8 Privacy Disclosure
Show clear status:
```text
Processing: on-device
Internet required: no
Memory text leaves device: no
```
Acceptance Criteria
Local model can produce structured suggestions.
App still works if model is unavailable.
Rules-only path remains complete.
User can disable local AI.
Bad model output cannot corrupt canonical data.
---
Milestone 7: Semantic Search and Embeddings
Goal
Allow users to find memories by meaning, not only exact words.
Deliverables
Embedding interface
Local embedding model adapter
Embedding table
Semantic search UI
Related memories
Tasks
7.1 Embedding Interface
Define:
```typescript
interface IEmbeddingEngine {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```
7.2 Embedding Storage
Add table:
```sql
memory_embedding
- memory_id TEXT PRIMARY KEY
- vector BLOB NOT NULL
- dimension INTEGER NOT NULL
- model_id TEXT NOT NULL
- model_version TEXT NOT NULL
- created_at DATETIME NOT NULL
```
7.3 Indexing Flow
When memory changes:
Mark embedding stale.
Queue background re-embedding.
Generate embedding.
Store model version.
Support full reindex if model changes.
7.4 Semantic Search v1
User query:
```text
"memories about losing pets"
```
Search flow:
```text
query -> embedding -> nearest memories -> display ranked results
```
7.5 Hybrid Search
Combine:
FTS score
tag score
semantic score
date relevance
user-confirmed metadata
7.6 Related Memories
On memory detail page, show:
```text
Related memories
```
Based on:
shared tags
shared entities
semantic similarity
same period
same place
7.7 Performance Safeguards
Limit embedding generation to charging/Wi-Fi setting if cloud is used.
For local-only, allow background indexing toggle.
Avoid blocking save flow.
Store queue status.
Acceptance Criteria
User can perform semantic search.
App can show related memories.
Embeddings can be regenerated if model changes.
App works without embeddings.
---
Milestone 8: Timeline and Memory Visualization
Goal
Make the archive visually explorable.
Deliverables
Timeline v2
Approximate date visualization
Tag graph
Life chapter view
Cluster view
Tasks
8.1 Timeline v2
Support:
Exact dates
Year-only dates
Date ranges
Decades
Unknown dates
Inferred dates
User-confirmed dates
Visual distinction:
```text
solid marker = confirmed date
faded marker = inferred date
wide bar = date range
unknown bucket = no date
```
8.2 Timeline Filters
Filter by:
Tag
Person
Pet
Place
Life period
Emotion
Theme
Date precision
Confirmed/inferred metadata
8.3 Tag Browser
Show:
Most-used tags
Recently used tags
People
Pets
Places
Life periods
Untagged memories
8.4 Tag Graph
Nodes:
memories
tags
people
pets
places
life periods
Edges:
memory has tag
memory mentions person
memory occurred at place
memory belongs to period
8.5 Cluster View
Cluster using:
shared tags
semantic similarity
time proximity
shared people/places
Example clusters:
```text
Childhood pets
Old house
School memories
Moving apartments
Family grief
Summer trips
```
8.6 Life Chapters
Generate candidate chapters from:
known life periods
date clusters
tag clusters
user-defined eras
User can rename, merge, split, or reject chapters.
Acceptance Criteria
User can browse memories visually.
Approximate dates are represented honestly.
Clusters are editable, not treated as ground truth.
App remains useful without embeddings.
---
Milestone 9: Import, Export, and Data Portability
Goal
Ensure user ownership and long-term durability.
Deliverables
Markdown export
JSON export
SQLite export
Import from JSON
Import from Markdown folder
Backup file
Optional encrypted backup
Tasks
9.1 Markdown Export
Structure:
```text
/memories/
  1994/
    lila-in-the-sunny-windowsill.md
  unknown-date/
    memory-title.md
/tags.json
/life-context.json
```
Each Markdown file:
```markdown
---
id: ...
title: ...
date: 1994-1995
date_precision: grade
tags:
  - Patrick
  - Lila
  - dog
  - cat
source: voice
---

Memory text here.
```
9.2 JSON Export
Include:
memories
tags
memory-tag links
people
pets
places
life periods
processing metadata
model versions
9.3 SQLite Export
Allow advanced users to export full database.
9.4 Import
Support:
JSON import
Markdown import
Duplicate detection
Conflict resolution
Preview before import
9.5 Backup
Manual backup:
local file
share sheet
cloud drive selected by user
Optional later:
encrypted automatic backup
Acceptance Criteria
User can leave the app with their data.
Exported data is human-readable.
App can restore from exported data.
No lock-in.
---
Milestone 10: Privacy, Security, and Trust
Goal
Make the app credible for deeply personal material.
Deliverables
Local-first privacy model
App lock
Optional encryption
Clear AI processing labels
Deletion guarantees
Data audit screen
Tasks
10.1 Privacy Labels
Every processing mode should show:
```text
Transcription: on device / cloud / unavailable
Tagging: rules / local model / cloud
Embedding: local / cloud / disabled
Audio retained: yes / no
```
10.2 App Lock
Support:
PIN
biometrics
auto-lock timeout
hide previews in app switcher
hide notification contents
10.3 Local Encryption
Options:
Rely on OS device encryption initially.
Add app-level encrypted database later.
Encrypt retained audio files.
Encrypt exports optionally.
10.4 Data Deletion
Support:
Delete memory
Delete retained audio
Delete all model outputs
Delete all embeddings
Delete local AI model
Delete entire archive
10.5 Audit Screen
Show:
Number of memories
Number of retained audio files
Storage used by database
Storage used by audio
Storage used by models
Storage used by embeddings
Last export date
Enabled processing modes
Acceptance Criteria
User understands where data goes.
App works without sending memory text anywhere.
User can delete sensitive artifacts.
App does not obscure AI/cloud behavior.
---
Milestone 11: Optional Cloud and Sync Layer
Goal
Add optional convenience without compromising local-first architecture.
Deliverables
Sync abstraction
Optional encrypted sync
Optional cloud AI adapter
Clear opt-in UX
Tasks
11.1 Sync Interface
```typescript
interface ISyncProvider {
  sync(): Promise<SyncResult>;
  getStatus(): Promise<SyncStatus>;
  resolveConflict(conflict: SyncConflict): Promise<void>;
}
```
11.2 Sync Modes
Support future providers:
```text
NoSyncProvider
iCloudSyncProvider
GoogleDriveBackupProvider
DropboxBackupProvider
SelfHostedWebDAVProvider
CustomServerSyncProvider
```
11.3 Conflict Resolution
Handle:
same memory edited on two devices
tag renamed on one device
deleted memory edited elsewhere
divergent life-context changes
11.4 Optional Cloud AI
Keep cloud AI behind adapters:
```text
CloudTranscriptionEngine
CloudStructuredExtractionEngine
CloudEmbeddingEngine
```
User must explicitly opt in.
11.5 Data Minimization
For cloud calls:
Send only selected memory text.
Never send full archive unless explicitly requested.
Do not send life-context graph unless required.
Show preview of what leaves device.
Acceptance Criteria
Sync is optional.
Cloud AI is optional.
Local-only mode remains complete.
User can inspect and disable cloud behavior.
---
Milestone 12: Product Refinement and Habit Formation
Goal
Make the app pleasant enough that users actually capture memories.
Deliverables
Fast capture
Low-friction tagging
Gentle resurfacing
Memory prompts
Streaks optional
Better editing
Tasks
12.1 Fast Capture Mode
Open directly to recording.
Add home screen shortcut.
Add lock screen/widget shortcut if platform supports it.
Add “save without reviewing” option.
Queue processing later.
12.2 Gentle Prompts
Examples:
```text
Do you remember another pet from that house?
Do you want to add more about Patrick?
You mentioned the old apartment. Add another memory from that place?
```
Important: prompts should be user-controlled and easy to disable.
12.3 Memory Review Inbox
Suggested metadata that needs confirmation goes into an inbox:
```text
12 memories need tag review
4 memories have uncertain dates
3 possible duplicate tags
```
12.4 Editing Experience
Split memory into two memories.
Merge memories.
Add addendum.
Add correction.
Add private note.
Mark memory as uncertain.
Mark memory as secondhand/heard from someone else.
12.5 Resurfacing
Optional features:
“On this day”
“From this era”
“Random memory”
“Unfinished memories”
“Memories involving this person/pet/place”
Acceptance Criteria
Capture is fast.
Metadata confirmation is not annoying.
App encourages use without feeling manipulative.
User remains in control.
---
6. Processing Pipeline Detail
6.1 Initial Save Pipeline
```text
User saves transcript
  |
  v
Create memory row
  |
  v
Run text cleanup
  |
  v
Run rules-based date extraction
  |
  v
Run entity extraction
  |
  v
Run tag suggestion
  |
  v
Optional: run local structured extraction
  |
  v
Merge suggestions
  |
  v
Display confirmation UI
  |
  v
Persist confirmed metadata
  |
  v
Update FTS index
  |
  v
Queue embedding generation if enabled
```
6.2 Background Reprocessing Pipeline
Needed when:
User changes birth year
User adds a life period
User changes model
User enables embeddings
App updates extraction logic
```text
Detect stale memories
  |
  v
Queue processing jobs
  |
  v
Process in batches
  |
  v
Store new suggestions separately
  |
  v
Do not overwrite confirmed user metadata
```
6.3 Metadata Precedence Rules
Priority order:
```text
1. User-confirmed metadata
2. User-entered metadata
3. Imported explicit metadata
4. Explicit text extraction
5. Known context inference
6. Rules-based inference
7. Local model suggestion
8. Cloud model suggestion
```
Important:
Lower-priority sources cannot overwrite higher-priority sources.
Conflicts should be visible.
User corrections should train future suggestions locally where feasible.
---
7. Suggested Repository Structure
```text
memory-journal/
  apps/
    mobile/
      src/
        ui/
        screens/
        components/
        navigation/
        state/
  packages/
    core/
      memory/
      tags/
      dates/
      entities/
      life-context/
      search/
      export/
      import/
    storage/
      sqlite/
      migrations/
      repositories/
    processing/
      pipeline/
      rules/
      model-adapters/
      embeddings/
    transcription/
      interfaces/
      native/
      whisper-cpp/
      cloud/
    visualization/
      timeline/
      graph/
      clusters/
    shared/
      types/
      utils/
      logging/
      feature-flags/
```
For a native implementation:
```text
ios/
android/
shared-spec/
  schemas/
  prompts/
  test-fixtures/
  extraction-cases/
```
Keep schemas and extraction test cases platform-neutral.
---
8. Testing Strategy
8.1 Unit Tests
Test:
Date extraction
Grade/year inference
Tag normalization
Entity matching
Deduplication
Search ranking
Export formatting
Import parsing
Metadata precedence
8.2 Golden Test Memories
Create a fixture set:
```text
childhood_pet_memory.txt
college_roommate_memory.txt
first_job_memory.txt
moving_apartment_memory.txt
vacation_memory.txt
grief_memory.txt
ambiguous_date_memory.txt
multiple_people_same_name.txt
```
Each fixture should include expected suggestions.
Example:
```json
{
  "input": "When I was in 4th grade, my dog Patrick died...",
  "expected_tags": ["4th grade", "Patrick", "dog", "pet"],
  "expected_date_precision": "grade",
  "expected_inferred_range": "1994-1995"
}
```
8.3 Integration Tests
Test full flow:
```text
record/transcribe/save/suggest/confirm/search/export
```
8.4 Regression Tests
Whenever extraction logic changes, rerun golden tests.
Do not allow model changes to silently degrade structured extraction.
8.5 Privacy Tests
Verify:
Audio is deleted when retention disabled.
Cloud adapters are not called in local-only mode.
Exports include expected data only.
Deleted memories do not appear in search.
App lock hides sensitive previews.
---
9. Important UX Decisions
9.1 Suggested Tags Should Not Feel Like AI Truth
Use wording like:
```text
Suggested tags
```
Not:
```text
Detected facts
```
9.2 Inferred Dates Need Explanation
Example:
```text
1994–1995
Inferred from: "4th grade" + your birth year
```
9.3 Allow Vague Memory Dates
Many memories will not have exact dates.
Support:
```text
around 1994
early childhood
before we moved
while living at old house
sometime in college
unknown
```
9.4 Preserve Ambiguity
Some memories are uncertain. The data model should allow:
```text
maybe
probably
not sure
secondhand
dreamlike
composite memory
```
This could become a distinctive feature.
9.5 Do Not Over-Optimize for Journaling
This is not a daily diary app.
It is more like:
```text
private autobiographical archive
```
So the app should support memories entered out of order.
---
10. Suggested Milestone Ordering
Phase 1: Useful Without AI
```text
Milestone 1: Product skeleton and local database
Milestone 2: Manual tags and basic search
Milestone 3: Voice capture and transcription
Milestone 4: Rules-based metadata suggestions
```
This produces a genuinely useful offline app.
Phase 2: Personal Intelligence
```text
Milestone 5: Life context graph
Milestone 6: Local structured extraction model
Milestone 7: Semantic search and embeddings
```
This makes the app feel intelligent.
Phase 3: Exploration and Durability
```text
Milestone 8: Timeline and memory visualization
Milestone 9: Import, export, and portability
Milestone 10: Privacy, security, and trust
```
This makes the app feel serious and long-lived.
Phase 4: Optional Expansion
```text
Milestone 11: Optional cloud and sync layer
Milestone 12: Product refinement and habit formation
```
This adds convenience without compromising architecture.
---
11. Recommended MVP Scope
For the first shippable prototype, build only this:
```text
1. Text memory entry
2. Voice-to-text using native APIs
3. SQLite storage
4. Manual tags
5. Rules-based suggested tags
6. Approximate date field
7. User profile with birth year
8. Grade/age/year inference
9. Full-text search
10. JSON/Markdown export
```
Do not include yet:
```text
Cloud sync
Cloud AI
Embeddings
Graph visualization
Cluster visualization
Audio archive
Large local LLM
Multi-device support
```
The MVP should prove:
```text
Do users want to capture memories this way?
Are suggested tags useful?
Does approximate dating feel natural?
Does search make the archive valuable?
```
---
12. Concrete MVP Example Flow
Input
```text
When I was in 4th grade, my dog Patrick died and my parents decided to get a cat.
We went to the animal shelter and found a tabby. I named her Lila.
She only lived with us for a short while until we moved into a smaller apartment,
but I have such a distinct memory of her laying in the sunny window sill of our old house.
```
Rules-Based Suggestions
```json
{
  "title": "Lila in the sunny windowsill",
  "date_candidates": [
    {
      "label": "4th grade",
      "inferred_range": "1994-1995",
      "precision": "grade",
      "confidence": 0.75,
      "explanation": "Inferred from grade and user birth year"
    }
  ],
  "tag_candidates": [
    { "name": "4th grade", "type": "life_period", "source": "explicit" },
    { "name": "Patrick", "type": "pet", "source": "explicit" },
    { "name": "Lila", "type": "pet", "source": "explicit" },
    { "name": "dog", "type": "theme", "source": "explicit" },
    { "name": "cat", "type": "theme", "source": "explicit" },
    { "name": "pet", "type": "theme", "source": "inferred" },
    { "name": "animal shelter", "type": "place", "source": "explicit" },
    { "name": "old house", "type": "place", "source": "explicit" },
    { "name": "apartment", "type": "place", "source": "explicit" },
    { "name": "childhood", "type": "life_period", "source": "inferred" }
  ]
}
```
User Confirmation
UI shows:
```text
Date:
[ ] 1994–1995, inferred from 4th grade
[ ] Unknown
[ ] Choose manually

Tags:
[x] Patrick
[x] Lila
[x] dog
[x] cat
[x] pet
[x] 4th grade
[x] old house
[ ] animal shelter
[ ] apartment
[ ] childhood
```
---
13. Architectural Rules to Preserve Flexibility
Rule 1: The Database Is Canonical
Model output is not canonical until user confirms it.
Rule 2: Store Provenance
Every suggestion should know where it came from.
Rule 3: Keep Raw Text
Never destroy the original transcript.
Rule 4: AI Is Optional
The app should be useful with:
```text
speech-to-text + SQLite + rules
```
Rule 5: Use Interfaces for Everything Replaceable
Especially:
```text
transcription
structured extraction
embeddings
search
sync
export
visualization
```
Rule 6: User Corrections Win
If the user says the date is 1993, do not keep re-suggesting 1994 as if nothing happened.
Rule 7: Prefer Small Local Models
For this app, extraction quality matters more than chatbot fluency.
Rule 8: Export Must Be Boring and Durable
Plain Markdown and JSON are better than clever proprietary formats.
---
14. Development Priorities
Highest Priority
```text
local storage
manual editability
search
export
tagging
date uncertainty
voice capture
rules-based suggestions
```
Medium Priority
```text
life-context graph
local structured extraction model
semantic search
related memories
timeline polish
```
Lower Priority
```text
cloud sync
cloud AI
large local model
complex visualizations
social sharing
collaboration
```
---
15. Risks and Mitigations
Risk: On-device speech is inconsistent
Mitigation:
Allow manual text entry.
Use native speech first.
Add optional local transcription later.
Add optional cloud transcription only with explicit opt-in.
Risk: Local LLM footprint is too large
Mitigation:
Do not require LLM.
Use rules first.
Make local model downloadable, not mandatory.
Use small structured extraction models only.
Risk: Tag suggestions become noisy
Mitigation:
Rank conservatively.
Let users reject tags.
Learn from rejected suggestions.
Separate explicit vs inferred.
Risk: Dates are often uncertain
Mitigation:
Treat approximate dates as first-class.
Support ranges.
Support life periods.
Explain inference.
Risk: App feels like work
Mitigation:
Keep capture flow fast.
Allow saving before metadata review.
Use a review inbox.
Do not force perfect organization upfront.
Risk: Privacy trust is weak
Mitigation:
Make local/offline status visible.
Default to deleting audio.
Make export simple.
Avoid hidden cloud calls.
Provide app lock.
---
16. Definition of Done for First Serious Prototype
The prototype is successful when a user can:
```text
1. Open the app.
2. Speak a memory.
3. Review the transcript.
4. Save it.
5. See suggested tags and date.
6. Confirm or reject suggestions.
7. Search for the memory later by text.
8. Filter by tag.
9. Browse approximate timeline.
10. Export their memories as Markdown or JSON.
```
The prototype should not require:
```text
internet
subscription
agent tokens
cloud storage
cloud LLM
large local model
```
---
17. Recommended Next Step
Before writing code, define these three documents:
```text
1. Data schema v0.1
2. Processing pipeline contract v0.1
3. Golden test memory set v0.1
```
Once those are stable, the implementation can proceed modularly without locking the project into a specific model, speech engine, or UI framework.

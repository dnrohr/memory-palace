# UI Roadmap for Memory Palace

Last updated: 2026-06-11

This document specifies the user interface direction for Memory Palace, with emphasis on two primary experiences:

1. **Capture** — inputting memories.
2. **Explore** — traversing, rediscovering, and organizing memories.

The guiding premise is that Memory Palace is not a productivity app, not a social journal, and not an AI dashboard. It is a private, local-first memory archive. The UI should make the user feel that they can safely put down a fragment of memory before it disappears, and later move through those memories without being overwhelmed, judged, analyzed, or forced into rigid structure.

The product already has a strong technical architecture: offline-first storage, canonical raw memory text, user-confirmed metadata, optional local processing, suggested tags/dates, timeline browsing, life-context entities, semantic search, import/export, and review workflows. The UI should expose this power gradually and quietly.

---

## 1. Product Feeling

### 1.1 Capture Feeling

When inputting a memory, the user should feel:

- Safe.
- Private.
- Unjudged.
- Unhurried.
- Free to be incomplete.
- Free to write badly.
- Free to save before understanding the memory.
- In control of what is retained, especially audio.
- Protected from premature classification.

The emotional promise of capture is:

> You can put this here without having to understand it yet.

Capture should not feel like filling out a form. It should feel like entering a small private room.

### 1.2 Explore Feeling

When traversing memories, the user should feel:

- Oriented.
- Curious.
- Safe.
- Gently surprised.
- Able to drift.
- Able to inspect.
- Able to stop.
- Able to understand why things are connected.
- Never trapped inside emotionally difficult material.
- Never diagnosed or psychoanalyzed by the app.

The emotional promise of explore is:

> There are paths through what you remembered, but you are not forced down any of them.

Explore should not feel like querying a database. It should feel like walking through a house the user used to live in.

---

## 2. Global UI Principles

### 2.1 Memory First, Metadata Second

The app must never require metadata before saving a memory.

A user should be able to:

1. Open the app.
2. Type or speak a memory.
3. Save it.
4. Leave.

Dates, tags, people, places, pets, chapters, related memories, and review suggestions are secondary layers.

### 2.2 Structure Without Domination

The app should offer structure, but never impose it.

Use language like:

- Possible date.
- Suggested tag.
- Possible chapter.
- Nearby memory.
- Connected by.
- Review later.

Avoid language like:

- Required.
- Incomplete.
- Missing metadata.
- AI analysis.
- Emotional diagnosis.
- Optimize.
- Submit.
- Entity extraction.

### 2.3 Never Block Saving

Saving raw memory text is the core action.

The UI must allow saving even if:

- Transcription fails.
- Metadata extraction fails.
- Tag suggestion fails.
- Date suggestion fails.
- Embedding generation fails.
- Search indexing fails.
- Audio retention fails.
- Review inbox generation fails.

Failures should be recoverable maintenance concerns, not blockers.

### 2.4 Preserve the Original

The UI must reinforce the data principle that the original memory is canonical.

Corrections, addenda, inferred metadata, and model suggestions should never visually imply that the original has been overwritten.

### 2.5 Explain Connections

Any generated or inferred connection between memories should be explainable in user-facing language.

Examples:

- Connected by: Lila · cat.
- Connected by: old house · moving.
- Related because: shared tag "pets".
- Nearby because: similar wording and approximate time period.

The user should never wonder why the app surfaced something.

### 2.6 Avoid Dashboard Energy

Do not make the app feel like quantified-self software.

Avoid foregrounding:

- Streaks.
- Scores.
- Sentiment graphs.
- Memory counts as achievement.
- Emotional trends.
- Productivity charts.
- “You seem sad” style conclusions.
- Confetti or gamification.

The UI can show counts when useful, but they should be quiet and informational.

### 2.7 Privacy Should Be Felt Before It Is Explained

Privacy should be expressed through product behavior and UI restraint.

Use small cues:

- Saved on this device.
- No account required.
- Audio is not kept unless you choose.
- Suggestions are optional.
- Export anytime.

Longer explanations belong in Settings, not on the primary capture screen.

---

## 3. App Shell and Navigation

### 3.1 Primary Navigation

Use a small, stable navigation model.

Recommended bottom navigation:

```text
Explore        +        Review        Settings
```

Where:

- `+` means New Memory / Capture.
- Explore is the browsing and rediscovery surface.
- Review is for optional metadata confirmation and cleanup.
- Settings is for privacy, export, import, lock, storage, and processing controls.

Alternative four-tab version:

```text
Capture   Explore   Review   Settings
```

However, the center-plus version better emphasizes capture as the primary action without making the user live in a capture tab.

### 3.2 Navigation Rules

- The capture action must be available from every primary screen.
- Explore pages should support clear back navigation.
- Deep explore pages should include subtle breadcrumbs.
- The user should always know where they are in the archive.
- Settings should be reachable but not prominent during emotional workflows.

Example breadcrumb:

```text
Explore → Places → Old house → A sunny window
```

### 3.3 Top-Level Screens

The app should have these top-level areas:

1. New Memory / Capture.
2. Explore Home.
3. Timeline.
4. People & Pets.
5. Places.
6. Themes.
7. Chapters.
8. Memory Detail.
9. Review Inbox.
10. Settings.

---

## 4. Visual System

### 4.1 Desired Aesthetic

The visual aesthetic should be:

> private notebook + archive box + museum wall label

It should not resemble:

- Social feed.
- Enterprise dashboard.
- Productivity database.
- Wellness streak app.
- AI assistant console.
- CRM.
- Analytics platform.

### 4.2 Layout Style

Use:

- Large readable text.
- Generous whitespace.
- Spacious cards.
- Soft grouping.
- Muted metadata.
- Few icons.
- Minimal borders.
- Clear hierarchy.
- Gentle transitions.
- Warm neutral surfaces.

Avoid:

- Dense tables.
- Loud gradients.
- Heavy chrome.
- Bright AI sparkle branding.
- Overbuilt charting.
- Persistent badges that imply obligation.

### 4.3 Typography

Recommended type hierarchy:

- Memory body: large, comfortable, highly readable.
- Titles: medium-large, calm.
- Metadata labels: small, subdued.
- Tags: small pill labels.
- Explanations: small but legible.

Consider a humanist sans-serif for the interface and either the same face or a restrained serif for long memory text. The memory text should feel worth reading.

### 4.4 Color

Use subdued colors.

Suggested roles:

- Background: warm off-white or dark charcoal.
- Primary text: high contrast.
- Secondary text: muted.
- Tags: low-saturation pills.
- Inferred metadata: softer or dotted visual treatment.
- Confirmed metadata: normal weight.
- Warnings/errors: clear but not alarming unless data loss is possible.

### 4.5 Motion

Motion should be calm and functional.

Use motion for:

- Opening capture sheet.
- Expanding optional details.
- Saving confirmation.
- Moving between related memories.
- Showing review sheets.

Avoid:

- Bouncy gamified animations.
- Confetti.
- Aggressive pulse animations.
- Excessive AI “thinking” indicators.

---

## 5. Capture UI Specification

Capture is the most emotionally sensitive part of the app. Its job is to reduce friction between memory and archive.

### 5.1 Capture Design Goals

Capture should:

- Open quickly.
- Have minimal UI.
- Center the writing/speaking surface.
- Avoid asking for title, date, or tags by default.
- Support typing and voice as equal first-class paths.
- Save raw text immediately.
- Defer metadata.
- Make audio retention explicit and optional.
- Allow editing transcript before save without requiring perfection.

### 5.2 New Memory Screen

Default layout:

```text
┌─────────────────────────────────────┐
│ New Memory                          │
│                                     │
│ What came back?                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│        ◯ Hold to speak              │
│                                     │
│ A fragment is enough.               │
│ Dates and tags can wait.            │
│                                     │
│                         [ Save ]    │
└─────────────────────────────────────┘
```

Required elements:

- Header: `New Memory`.
- Prompt: `What came back?`
- Large text input.
- Voice capture button.
- Reassurance line.
- Save button.

Do not show by default:

- Title input.
- Date picker.
- Tag picker.
- People picker.
- Place picker.
- Emotional tone selector.
- AI processing status.
- Required-field indicators.

### 5.3 Capture Microcopy

Recommended:

- What came back?
- A fragment is enough.
- Dates and tags can wait.
- Save as-is.
- Edit only what matters.
- Saved privately.
- Review later.
- Keep original audio.

Avoid:

- Submit.
- Complete entry.
- Required.
- Metadata.
- AI-generated.
- Analyze.
- Processing memory.
- Optimize.

### 5.4 Text Capture Behavior

Rules:

- Text area receives focus automatically when opening typed capture.
- Save button becomes active once text is non-empty.
- Draft should autosave locally if possible.
- Back/close should warn only if unsaved text exists.
- If the user saves without a title, generate a display title later from first line or local structured extraction.
- No metadata confirmation before save.

Acceptance criteria:

- User can create and save a typed memory in no more than two taps after opening capture.
- User can save without adding title, date, or tags.
- Memory is persisted even if suggestion generation fails.

### 5.5 Voice Capture Entry

Voice button should be large and central but visually calm.

Possible interaction models:

1. Tap to record, tap to stop.
2. Hold to speak.
3. Support both if platform conventions allow.

Recommended default: tap to record, tap to stop. Holding can be an advanced shortcut.

### 5.6 Recording State

Layout:

```text
┌─────────────────────────────────────┐
│ Listening                           │
│                                     │
│              00:42                  │
│                                     │
│          soft waveform              │
│                                     │
│             [ Stop ]                │
│                                     │
│ No audio is kept unless you choose. │
└─────────────────────────────────────┘
```

Required elements:

- Recording status.
- Elapsed time.
- Gentle visual activity indicator.
- Stop button.
- Privacy note about audio retention.

Rules:

- Avoid harsh red full-screen visual treatment.
- Show microphone permission errors clearly and calmly.
- If recording fails, allow immediate typed fallback.
- If transcription fails, allow manual transcript entry.
- Do not retain audio by default unless the user has explicitly enabled it.

### 5.7 Transcript Review Screen

Layout:

```text
┌─────────────────────────────────────┐
│ Here is what I heard                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ When I was in 4th grade...      │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ Save memory ]                     │
│                                     │
│ Optional                            │
│ ○ Keep original audio               │
│                                     │
│ Edit only what matters.             │
└─────────────────────────────────────┘
```

Required elements:

- Editable transcript.
- Save memory button.
- Optional audio retention toggle.
- Reassurance copy.

Rules:

- Transcript does not need to be “complete” to save.
- User can save without reviewing suggestions.
- Audio retention state must be explicit.
- If audio retention is off, UI should say so plainly.

### 5.8 Optional Details Drawer

The capture screen may include a collapsed `Add details` drawer.

Default state: collapsed.

Fields inside drawer:

- Approximate date.
- Date confidence/precision.
- Tags.
- People.
- Pets.
- Places.
- Life period/chapter.
- Private note/correction.
- Keep audio toggle.

Rules:

- Drawer must never be required.
- Drawer should not visually compete with text/voice capture.
- User-confirmed fields should be visually distinct from suggestions.

### 5.9 Post-Save Suggestion Sheet

After save, show optional suggestions.

Layout:

```text
┌─────────────────────────────────────┐
│ Saved privately                     │
│                                     │
│ I found a few possible details.     │
│                                     │
│ Date                                │
│ around 1994              [confirm]  │
│                                     │
│ Tags                                │
│ childhood   dog   cat   Lila        │
│                                     │
│ [ Review now ]      [ Later ]       │
└─────────────────────────────────────┘
```

Rules:

- The memory must already be saved before this appears.
- Sheet can be dismissed.
- `Later` sends suggestions to Review.
- Confirmed suggestions update user-confirmed metadata.
- Rejected suggestions should suppress repeated suggestions where supported.

### 5.10 Capture Failure States

#### Microphone Permission Denied

Copy:

> Microphone access is off. You can still type the memory.

Actions:

- Open settings if platform supports it.
- Type instead.

#### Recording Failed

Copy:

> Recording did not start. You can try again or type the memory.

Actions:

- Try again.
- Type instead.

#### Transcription Failed

Copy:

> I could not create a transcript. You can type what you remember or save a note about the recording.

Actions:

- Type transcript.
- Retry transcription if available.
- Discard recording.
- Keep audio only if user explicitly chooses.

#### Suggestion Generation Failed

Copy:

> Saved. Suggestions can be generated later.

Actions:

- Done.
- Review later.

---

## 6. Explore UI Specification

Explore is for moving through the archive. It should support both intentional search and associative wandering.

### 6.1 Explore Design Goals

Explore should:

- Orient the user.
- Offer multiple ways in.
- Avoid overwhelming lists.
- Let the user drift through associations.
- Make connections explainable.
- Represent uncertainty gracefully.
- Avoid psychological overreach.
- Support retreat from sensitive material.
- Make generated structures editable.

### 6.2 Explore Information Architecture

Explore should include:

- Search.
- Continue from.
- Recently added.
- Timeline.
- People & pets.
- Places.
- Themes.
- Chapters.
- Memory detail.
- Related memories.

The default Explore Home should not be only a search results list.

### 6.3 Explore Home

Layout:

```text
┌─────────────────────────────────────┐
│ Explore                             │
│                                     │
│ Search memories...                  │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Continue from                       │
│ ┌──────────────┐ ┌──────────────┐   │
│ │ Old house    │ │ Lila         │   │
│ │ years        │ │ 3 memories   │   │
│ └──────────────┘ └──────────────┘   │
│ ┌──────────────┐ ┌──────────────┐   │
│ │ Unknown      │ │ Moving       │   │
│ │ dates        │ │ 5 memories   │   │
│ └──────────────┘ └──────────────┘   │
│                                     │
│ Ways through                        │
│ Timeline                            │
│ People & pets                       │
│ Places                              │
│ Themes                              │
│ Chapters                            │
│                                     │
│ Recently added                      │
│ A sunny window                      │
│ The animal shelter                  │
└─────────────────────────────────────┘
```

Sections:

1. Search.
2. Continue from.
3. Ways through.
4. Recently added.

Rules:

- Search is prominent but not dominant.
- Continue cards should be based on recent user exploration and useful unresolved areas.
- `Unknown dates` can be a meaningful exploration path, not a problem state.
- Avoid red badges or guilt-inducing counts.

### 6.4 Search

Search modes:

- Keyword.
- Semantic/nearby.
- Tag-filtered.
- Date-filtered.

UI labels:

- `Search memories`.
- `Keyword`.
- `Nearby meaning`.
- `Filters`.

Avoid labels:

- Vector.
- Embedding.
- Cosine similarity.
- AI search.

Search results should explain matches when useful:

- Matched text.
- Matched tag.
- Related by similar wording.
- Filtered by date.

### 6.5 Memory Cards

Default card:

```text
┌─────────────────────────────────────┐
│ A sunny window                      │
│ around 1994, maybe                  │
│                                     │
│ “She only lived with us for a short │
│ while, but I remember her lying...” │
│                                     │
│ Lila · old house · cat · moving     │
└─────────────────────────────────────┘
```

Fields:

- Title or generated summary.
- Date / approximate date / unknown date.
- Short excerpt.
- Up to 5 tags/entities.
- Optional subtle marker for inferred metadata.

Rules:

- Cards should be readable, not dense.
- Avoid showing confidence percentages by default.
- Avoid emotional-tone labels by default.
- Do not overload cards with actions.

### 6.6 Memory Detail Page

Layout:

```text
┌─────────────────────────────────────┐
│ A sunny window                      │
│ around 1994, maybe                  │
│                                     │
│ When I was in 4th grade...          │
│                                     │
│ Details                             │
│ Lila                                │
│ old house                           │
│ cat                                 │
│ moving                              │
│                                     │
│ Addendum                            │
│ Add a later note or correction      │
│                                     │
│ Nearby memories                     │
│ ┌─────────────────────────────────┐ │
│ │ The animal shelter              │ │
│ │ Connected by: Lila · cat        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Leaving the old house           │ │
│ │ Connected by: old house · moving│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Required sections:

1. Title.
2. Date and date certainty.
3. Memory text.
4. Details/metadata.
5. Addendum.
6. Nearby memories.
7. Editing controls.

Rules:

- Original text should be visually primary.
- Addenda should appear as later notes, not modifications to the original.
- Related memories must show why they are related.
- Tags/entities should be tappable pathways.
- Edit controls should be available but not visually dominant.

### 6.7 Timeline

Timeline should support memory-like chronology, not calendar-like scheduling.

Layout:

```text
┌─────────────────────────────────────┐
│ Timeline                            │
│                                     │
│ Filter: All dates                   │
│                                     │
│ Childhood                           │
│                                     │
│ around 1994                         │
│ ┌─────────────────────────────────┐ │
│ │ A sunny window                  │ │
│ │ “She only lived with us...”     │ │
│ │ Lila · old house · cat          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ probably 1995                       │
│ ┌─────────────────────────────────┐ │
│ │ The smaller apartment           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Unknown date                        │
│ ┌─────────────────────────────────┐ │
│ │ The animal shelter              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Date representations:

- Confirmed exact date.
- Confirmed approximate date.
- Inferred date.
- Date range.
- Year window.
- Unknown date.

Rules:

- Unknown dates should have a graceful home.
- Approximate dates should not look like errors.
- Inferred dates should be visually softer than confirmed dates.
- Timeline filters should include all supported date certainty types.
- Calendar widgets should not be the default timeline metaphor.

### 6.8 People & Pets Pages

Entity list layout:

```text
┌─────────────────────────────────────┐
│ People & Pets                       │
│                                     │
│ Lila                                │
│ Pet · 3 memories                    │
│                                     │
│ Patrick                             │
│ Pet · 5 memories                    │
│                                     │
│ Mom                                 │
│ Person · 12 memories                │
└─────────────────────────────────────┘
```

Entity detail layout:

```text
┌─────────────────────────────────────┐
│ Lila                                │
│ Pet                                 │
│                                     │
│ Appears in 3 memories               │
│                                     │
│ Often with                          │
│ old house · cat · moving · window   │
│                                     │
│ Memories                            │
│ The animal shelter                  │
│ A sunny window                      │
│ The smaller apartment               │
└─────────────────────────────────────┘
```

Rules:

- Do not make entity pages feel like contact records.
- Use `Appears in` rather than productivity/accounting language.
- Show recurring details as associative paths.
- Let the user merge/rename entities from an unobtrusive menu.

### 6.9 Places Pages

Places list:

```text
┌─────────────────────────────────────┐
│ Places                              │
│                                     │
│ Old house                           │
│ 17 memories · roughly 1991–1995     │
│                                     │
│ Smaller apartment                   │
│ 6 memories                          │
└─────────────────────────────────────┘
```

Place detail:

```text
┌─────────────────────────────────────┐
│ Old house                           │
│ Place                               │
│                                     │
│ 17 memories                         │
│ roughly 1991–1995                   │
│                                     │
│ Recurring details                   │
│ kitchen · window · Patrick · winter │
│                                     │
│ Memories                            │
│ ...                                 │
└─────────────────────────────────────┘
```

Rules:

- Places should feel atmospheric.
- Show time range if known.
- Show recurring details.
- Avoid map-first UI unless geolocation is explicit and user-controlled.

### 6.10 Themes / Tags

Default themes view should be cluster cards, not a raw tag table.

Layout:

```text
┌─────────────────────────────────────┐
│ Themes                              │
│                                     │
│ Childhood                           │
│ 23 memories                         │
│ school · pets · old house           │
│                                     │
│ Moving                              │
│ 5 memories                          │
│ apartment · boxes · leaving         │
│                                     │
│ Pets                                │
│ 8 memories                          │
│ Patrick · Lila · animal shelter     │
└─────────────────────────────────────┘
```

Rules:

- Use cluster data to create readable shelves.
- Literal graph view may exist as optional advanced view.
- Default should favor comprehension over visual novelty.
- Tags should be tappable and editable.
- Merge/rename tag controls should be present but secondary.

### 6.11 Chapters

Chapters are suggested narrative shelves. The app must not sound too authoritative.

Chapters list:

```text
┌─────────────────────────────────────┐
│ Chapters                            │
│                                     │
│ Possible chapter                    │
│ ┌─────────────────────────────────┐ │
│ │ The old house years             │ │
│ │ roughly 1991–1995               │ │
│ │ 37 memories                     │ │
│ │                                 │ │
│ │ Patrick · Lila · school · moving│ │
│ │                                 │ │
│ │ [Open] [Rename] [Hide]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Chapter detail:

```text
┌─────────────────────────────────────┐
│ The old house years                 │
│ roughly 1991–1995                   │
│                                     │
│ Recurring details                   │
│ Patrick · Lila · sunny window       │
│                                     │
│ Memories                            │
│ A sunny window                      │
│ The animal shelter                  │
│ Leaving the old house               │
│                                     │
│ Chapter controls                    │
│ Rename · Split · Merge · Hide       │
└─────────────────────────────────────┘
```

Rules:

- Use `Possible chapter` for generated chapters until user accepts/renames them.
- User can rename, hide, split, merge, or reject chapters.
- Generated chapters must not overwrite user-defined chapters.
- Chapters should be editable shelves, not fixed autobiography.

### 6.12 Related / Nearby Memories

Related memories should appear on detail pages and some entity/chapter pages.

Card:

```text
┌─────────────────────────────────────┐
│ The animal shelter                  │
│ Connected by: Lila · cat            │
└─────────────────────────────────────┘
```

Connection explanation types:

- Shared tag.
- Shared person.
- Shared pet.
- Shared place.
- Approximate time period.
- Similar wording.
- Same chapter.
- User-created link.

Rules:

- Always show a connection explanation.
- Avoid scores.
- Allow dismissing a related suggestion if it feels wrong.
- Use `Nearby memories` rather than `Recommended`.

---

## 7. Review UI Specification

Review is where suggestions become user-confirmed data. It should feel optional and calm.

### 7.1 Review Design Goals

Review should:

- Help clean up the archive.
- Avoid guilt.
- Avoid red badges.
- Avoid productivity pressure.
- Let users accept, edit, dismiss, or defer suggestions.
- Preserve user authority.

### 7.2 Review Inbox

Layout:

```text
┌─────────────────────────────────────┐
│ Review                              │
│                                     │
│ 4 memories have possible details    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ A sunny window                  │ │
│ │ Suggested date: around 1994     │ │
│ │ Suggested tags: Lila, cat       │ │
│ │                                 │ │
│ │ [Accept] [Edit] [Dismiss]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Copy:

- `possible details`
- `review when you want`
- `accept`
- `edit`
- `dismiss`
- `later`

Avoid:

- `incomplete`
- `needs attention`
- `fix`
- `missing`
- `required`

### 7.3 Review Item Types

Review inbox should support:

- Suggested tags.
- Suggested dates.
- Untagged memories.
- Inferred people/pets/places.
- Possible duplicate tags.
- Possible chapter candidates.
- Import conflicts.
- Low-confidence extraction suggestions.

### 7.4 Review Actions

Each suggestion should support:

- Accept.
- Edit.
- Reject/dismiss.
- Later.
- Do not suggest again where appropriate.

Acceptance criteria:

- User can clear or defer a review item in one tap.
- Rejected tag suggestions are persisted where supported.
- Accepted suggestions are stored as user-confirmed metadata.
- Review is never mandatory for capture or explore.

---

## 8. Settings UI Specification

Settings is the control room. It should be boring, explicit, and trustworthy.

### 8.1 Settings Sections

Recommended structure:

```text
Privacy
Local processing
Audio retention
App lock
Encryption
Export archive
Import archive
Storage
Processing logs
Advanced diagnostics
```

### 8.2 Privacy

Show:

- Offline-first status.
- Whether cloud sync is enabled.
- Whether cloud AI is enabled.
- Whether local extraction is enabled.
- Whether local embeddings are enabled.
- Whether audio retention is enabled.

Copy should be factual and plain.

### 8.3 Audio Retention

Controls:

- Default audio retention: on/off.
- Delete retained audio references.
- Explain that transcript text remains unless deleted separately.

### 8.4 App Lock

Controls:

- Enable PIN.
- Enable biometric lock where available.
- Lock now.
- Disable lock.

### 8.5 Encryption

Controls:

- Encryption status.
- Adapter status.
- Explanation if no production encryption adapter is active.

### 8.6 Export / Import

Controls:

- Export JSON.
- Export Markdown.
- Export SQLite dump.
- Export backup bundle.
- Import JSON.
- Import Markdown.
- Import bundle when supported.

Copy:

- `Export anytime.`
- `Your archive is meant to remain portable.`

### 8.7 Storage and Diagnostics

Show:

- Active memories.
- Deleted memories.
- Tags.
- Retained audio count/bytes.
- Embedding count/bytes.
- Processing logs.
- Stale embedding queue.
- Estimated local storage.

Keep diagnostics visually separate from everyday use.

---

## 9. Component Inventory

### 9.1 Core Components

- `AppShell`
- `BottomNav`
- `CenterCaptureButton`
- `ScreenHeader`
- `BreadcrumbTrail`
- `MemoryTextInput`
- `VoiceCaptureButton`
- `RecordingPanel`
- `TranscriptEditor`
- `SaveMemoryButton`
- `PostSaveSuggestionSheet`
- `OptionalDetailsDrawer`
- `MemoryCard`
- `MemoryList`
- `SearchBox`
- `FilterBar`
- `TagPill`
- `DateCertaintyLabel`
- `ConnectionReason`
- `NearbyMemoryCard`
- `EntityCard`
- `EntityDetailHeader`
- `ChapterCard`
- `ThemeClusterCard`
- `ReviewSuggestionCard`
- `SettingsSection`
- `PrivacyStatusRow`
- `StorageDiagnosticRow`

### 9.2 Date Components

- `ConfirmedDateLabel`
- `ApproximateDateLabel`
- `InferredDateLabel`
- `DateRangeLabel`
- `UnknownDateLabel`
- `DatePrecisionFilter`

### 9.3 Capture Components

- `NewMemoryComposer`
- `DraftAutosaveProvider`
- `MicrophonePermissionNotice`
- `RecordingTimer`
- `RecordingWaveform`
- `AudioRetentionToggle`
- `TranscriptionErrorState`
- `TypedFallbackPrompt`

### 9.4 Explore Components

- `ExploreHome`
- `ContinueFromRail`
- `WaysThroughList`
- `RecentlyAddedList`
- `TimelineView`
- `TimelineSection`
- `PeoplePetsView`
- `PlacesView`
- `ThemesView`
- `ChaptersView`
- `MemoryDetailView`
- `RelatedMemoriesSection`
- `ConnectionInspector`

### 9.5 Review Components

- `ReviewInbox`
- `SuggestedTagsReviewCard`
- `SuggestedDateReviewCard`
- `SuggestedEntityReviewCard`
- `ChapterCandidateReviewCard`
- `ImportConflictReviewCard`

---

## 10. Data-to-UI Mapping

### 10.1 Memory

UI fields:

- `title` or generated display title.
- `rawText`.
- `createdAt`.
- `memoryDate`.
- `datePrecision`.
- `dateSource`.
- `tags`.
- `people`.
- `pets`.
- `places`.
- `lifePeriods`.
- `addenda`.
- `retainedAudioReference`.
- `deletedAt`.
- `suggestions`.
- `embeddingStatus`.

### 10.2 Metadata Certainty

Visual treatment:

- User-confirmed: normal text/pill.
- Imported: normal but source-inspectable.
- Inferred: softer text/pill.
- Suggested/unconfirmed: appears only in suggestion/review context.
- Rejected: hidden from default UI, visible in diagnostics if needed.

### 10.3 Related Memory Reasons

Every related memory result should include a `reasons` array suitable for display.

Examples:

```json
[
  { "type": "shared_tag", "label": "cat" },
  { "type": "shared_pet", "label": "Lila" }
]
```

Displayed as:

```text
Connected by: Lila · cat
```

### 10.4 Chapters

Generated chapters should include:

- Candidate title.
- Date range or approximate period.
- Memory count.
- Recurring details.
- Source basis.
- User state: pending, renamed, hidden, accepted, rejected.

---

## 11. Implementation Roadmap

### Phase UI-1: Visual Foundation and App Shell

Goal: establish the product’s visual identity and navigation.

Tasks:

1. Define design tokens:
   - spacing scale,
   - typography scale,
   - color roles,
   - border radius,
   - shadow/elevation,
   - muted metadata colors,
   - date certainty styles.

2. Build app shell:
   - bottom navigation,
   - center capture button,
   - screen header,
   - safe area handling,
   - keyboard-aware layout.

3. Build base components:
   - cards,
   - section headers,
   - tag pills,
   - primary/secondary buttons,
   - subtle sheets,
   - empty states.

4. Implement dark/light compatibility:
   - warm light theme,
   - calm dark theme,
   - accessible contrast.

Acceptance criteria:

- App has stable navigation.
- Capture can be opened globally.
- Visual hierarchy is consistent.
- Components render on mobile and web.
- No screen relies on dense tables for primary use.

---

### Phase UI-2: Minimal Capture

Goal: allow low-friction typed memory capture.

Tasks:

1. Implement `NewMemoryComposer`.
2. Add prompt copy: `What came back?`
3. Add large text area.
4. Add reassurance copy: `A fragment is enough. Dates and tags can wait.`
5. Add save action.
6. Persist raw memory text.
7. Generate display title if none exists.
8. Add local draft autosave.
9. Add unsaved draft warning only when necessary.
10. Add post-save confirmation: `Saved privately.`

Acceptance criteria:

- User can open capture and save typed memory quickly.
- User is not asked for title/date/tags.
- Save succeeds without metadata.
- Raw memory appears in archive.
- Failure of suggestion pipeline does not block save.

---

### Phase UI-3: Voice Capture Flow

Goal: make voice capture feel central, calm, and private.

Tasks:

1. Add voice button to capture screen.
2. Add microphone permission handling.
3. Implement recording state:
   - timer,
   - waveform/pulse,
   - stop button,
   - privacy note.

4. Implement transcript review screen:
   - editable transcript,
   - save memory,
   - optional audio retention toggle,
   - error fallback.

5. Add typed fallback for:
   - permission denied,
   - recording failed,
   - transcription failed.

6. Ensure audio is not retained by default unless setting/user choice says otherwise.

Acceptance criteria:

- User can record, stop, review transcript, and save.
- User can edit transcript before saving.
- User can save even if transcript is imperfect.
- User can type instead if voice fails.
- Audio retention state is explicit.

---

### Phase UI-4: Post-Save Suggestions

Goal: surface intelligence only after memory is saved.

Tasks:

1. Implement post-save suggestion sheet.
2. Display suggested date if available.
3. Display suggested tags if available.
4. Add `Review now`.
5. Add `Later`.
6. Add accept/reject actions for simple suggestions.
7. Route deferred suggestions to Review inbox.
8. Persist rejected suggestions where applicable.

Acceptance criteria:

- Suggestions appear only after successful save.
- User can dismiss suggestions.
- User can confirm suggestions.
- User can defer suggestions.
- Suggestions never block capture.

---

### Phase UI-5: Explore Home

Goal: create a calm entry point into the archive.

Tasks:

1. Implement Explore Home layout.
2. Add search box.
3. Add Continue From section.
4. Add Ways Through section:
   - Timeline,
   - People & pets,
   - Places,
   - Themes,
   - Chapters.

5. Add Recently Added section.
6. Add empty states for new archive.
7. Add navigation to each explore mode.

Acceptance criteria:

- Explore is useful without search.
- User has multiple intuitive entry points.
- Continue cards are not framed as tasks.
- Recently added memories are visible.
- Empty archive state points toward capture.

---

### Phase UI-6: Memory Cards and Detail Pages

Goal: make individual memories readable and associative.

Tasks:

1. Implement `MemoryCard`.
2. Add title/display title.
3. Add date certainty label.
4. Add excerpt.
5. Add tag/entity pills.
6. Implement `MemoryDetailView`.
7. Display original raw text prominently.
8. Display details/metadata.
9. Add addendum composer.
10. Add edit controls.
11. Add nearby memories section.
12. Show connection reasons.

Acceptance criteria:

- Memory cards are readable and uncluttered.
- Detail page foregrounds original text.
- Related memories include explanations.
- Tags/entities are tappable.
- Addenda do not overwrite original text.

---

### Phase UI-7: Timeline

Goal: provide graceful chronological browsing.

Tasks:

1. Implement timeline sections.
2. Group by life period/date bucket.
3. Display confirmed dates.
4. Display approximate dates.
5. Display inferred dates.
6. Display date ranges.
7. Display unknown date section.
8. Add date certainty filters.
9. Add timeline empty states.

Acceptance criteria:

- Unknown dates look intentional, not broken.
- Approximate/inferred dates are visually distinct.
- User can filter by date certainty.
- Timeline does not resemble a scheduling calendar.

---

### Phase UI-8: Entities — People, Pets, Places

Goal: let the user traverse memories through recurring beings and locations.

Tasks:

1. Implement People & Pets list.
2. Implement entity detail page.
3. Show memory count.
4. Show recurring details.
5. Show associated memories.
6. Add rename/merge controls behind menu.
7. Implement Places list.
8. Implement Place detail page.
9. Show approximate time range for places where available.
10. Avoid map-first UI.

Acceptance criteria:

- Entity pages feel like constellations, not contacts.
- Places feel atmospheric.
- User can traverse from entity to memory and back.
- Rename/merge controls exist but are unobtrusive.

---

### Phase UI-9: Themes and Tag Clusters

Goal: expose thematic structure without overwhelming graphs.

Tasks:

1. Implement Themes view.
2. Show cluster cards.
3. Display memory count.
4. Display representative tags/entities.
5. Link theme cards to memory lists.
6. Add optional advanced graph view only after cluster cards work well.
7. Add tag rename/merge controls where appropriate.

Acceptance criteria:

- Themes are understandable without graph literacy.
- User can open a theme and see related memories.
- Graph visualization is not the default primary UI.
- Tags remain editable and mergeable.

---

### Phase UI-10: Chapters

Goal: make generated life chapters into editable shelves.

Tasks:

1. Implement Chapters list.
2. Display generated chapters as `Possible chapter`.
3. Show date range.
4. Show memory count.
5. Show recurring details.
6. Add open/rename/hide controls.
7. Implement chapter detail page.
8. Add split/merge actions.
9. Persist accepted/renamed/hidden/rejected state.
10. Ensure generated chapters do not overwrite user-defined chapters.

Acceptance criteria:

- Generated chapters do not feel authoritative.
- User can rename, hide, split, and merge chapters.
- Chapter detail offers coherent memory traversal.
- Rejected chapters stay hidden unless restored.

---

### Phase UI-11: Review Inbox

Goal: make suggestion cleanup optional and calm.

Tasks:

1. Implement Review Inbox screen.
2. Add review cards for:
   - suggested tags,
   - suggested dates,
   - suggested entities,
   - untagged memories,
   - chapter candidates,
   - import conflicts.

3. Add accept/edit/dismiss/later actions.
4. Avoid red badges.
5. Add low-pressure empty state.
6. Persist review decisions.

Acceptance criteria:

- Review feels optional.
- User can accept, edit, dismiss, or defer each item.
- Review decisions affect future suggestions.
- Capture and Explore work even with pending review items.

---

### Phase UI-12: Settings and Trust Controls

Goal: expose privacy, portability, and diagnostics clearly.

Tasks:

1. Build Settings sections:
   - Privacy,
   - Local processing,
   - Audio retention,
   - App lock,
   - Encryption,
   - Export archive,
   - Import archive,
   - Storage,
   - Processing logs,
   - Advanced diagnostics.

2. Display current processing modes.
3. Add audio retention controls.
4. Add app lock controls.
5. Add encryption status.
6. Add export/import controls.
7. Add storage diagnostics.
8. Add cleanup actions.
9. Add stale embedding queue visibility.

Acceptance criteria:

- User can understand where data lives.
- User can export archive.
- User can control audio retention.
- User can see whether cloud/local processing is active.
- Diagnostics are available but not part of everyday use.

---

### Phase UI-13: Emotional Safety and Resurfacing Controls

Goal: prevent the explorer from becoming emotionally coercive.

Tasks:

1. Add memory-level sensitivity controls.
2. Add `Show less like this`.
3. Add resurfacing exclusions by:
   - tag,
   - person,
   - pet,
   - place,
   - period,
   - chapter.

4. Ensure resurfacing is opt-in or gentle by default.
5. Add easy exit from resurfaced memory.
6. Avoid default `On this day` resurfacing unless user enables it.

Acceptance criteria:

- User can prevent unwanted resurfacing.
- User can dismiss related-memory suggestions.
- Sensitive memories are not pushed aggressively.
- Explore never traps the user in a painful path.

---

### Phase UI-14: Polish and Usability Testing

Goal: validate that the app feels simple, safe, and beautiful.

Tasks:

1. Run capture usability tests:
   - typed memory,
   - voice memory,
   - failed transcription,
   - save without metadata.

2. Run explore usability tests:
   - find a known memory,
   - drift from one memory to another,
   - inspect why a memory is related,
   - browse unknown dates,
   - rename/hide a chapter.

3. Review emotional-response findings:
   - Did users feel pressured?
   - Did suggestions feel spooky?
   - Did the app feel private?
   - Did the explorer feel overwhelming?
   - Did users understand date uncertainty?

4. Simplify screens based on observed friction.
5. Remove or hide features that make the app feel like a dashboard.
6. Tune microcopy.

Acceptance criteria:

- Users can save memories without instruction.
- Users understand suggestions are optional.
- Users understand inferred vs confirmed metadata.
- Users can explain why a related memory appeared.
- Users describe the app as private, calm, and easy to use.

---

## 12. Screen-by-Screen Acceptance Checklist

### Capture

- [ ] Can open globally.
- [ ] Can type immediately.
- [ ] Can record voice.
- [ ] Can save without title.
- [ ] Can save without date.
- [ ] Can save without tags.
- [ ] Save happens before suggestions.
- [ ] Audio retention is explicit.
- [ ] Errors offer typed fallback.
- [ ] UI feels uncluttered.

### Explore Home

- [ ] Search is available.
- [ ] Non-search entry points exist.
- [ ] Continue cards exist.
- [ ] Timeline is reachable.
- [ ] People/pets are reachable.
- [ ] Places are reachable.
- [ ] Themes are reachable.
- [ ] Chapters are reachable.
- [ ] Recent memories are visible.
- [ ] Empty state leads to capture.

### Memory Detail

- [ ] Original text is primary.
- [ ] Date certainty is visible.
- [ ] Tags/entities are visible.
- [ ] Addenda are separate.
- [ ] Nearby memories are present.
- [ ] Connections are explained.
- [ ] Edit controls are available.
- [ ] User can navigate sideways.

### Timeline

- [ ] Confirmed dates render.
- [ ] Approximate dates render.
- [ ] Inferred dates render.
- [ ] Ranges render.
- [ ] Unknown dates render.
- [ ] Filters work.
- [ ] Timeline does not feel like a calendar.

### Review

- [ ] Suggestions are optional.
- [ ] Accept works.
- [ ] Edit works.
- [ ] Dismiss works.
- [ ] Later works.
- [ ] Review is low-pressure.
- [ ] Pending review does not block use.

### Settings

- [ ] Privacy status is clear.
- [ ] Local/cloud processing state is clear.
- [ ] Export works.
- [ ] Import works.
- [ ] Audio retention controls work.
- [ ] App lock controls work.
- [ ] Storage diagnostics are visible.
- [ ] Advanced diagnostics are separate.

---

## 13. Copy Guidelines

### 13.1 Preferred Terms

Use:

- Memory.
- Fragment.
- Addendum.
- Nearby.
- Connected by.
- Possible.
- Suggested.
- Confirmed.
- Review later.
- Saved privately.
- Keep original.
- Approximate date.
- Unknown date.
- Possible chapter.

### 13.2 Terms to Avoid

Avoid:

- Submit.
- Required.
- Incomplete.
- Fix.
- Missing.
- Metadata.
- Entity extraction.
- Vector search.
- Embedding score.
- AI-generated emotion.
- Sentiment trend.
- Optimize.
- Analyze.
- Productivity.
- Streak.

### 13.3 Tone

The UI tone should be:

- Plain.
- Gentle.
- Direct.
- Non-therapeutic.
- Non-clinical.
- Non-corporate.
- Non-gamified.

It should not sound like a therapist, coach, or productivity assistant.

---

## 14. Open Product Questions

These should be decided during design/prototyping:

1. Should the main nav have `Capture` as a tab or a center `+` action?
2. Should voice capture use tap-to-record, hold-to-record, or both?
3. Should titles be visible in capture at all?
4. Should emotional tone ever be shown outside Settings/Review?
5. Should `On this day` exist, and if so, should it be opt-in only?
6. Should graph visualization be available in v1, or deferred until cluster cards are strong?
7. Should chapters be mixed with user-defined life periods or kept separate?
8. How should sensitive memories be marked without making the app feel clinical?
9. Should retained audio appear on memory detail, or only in edit/settings contexts?
10. How explicit should local AI/local processing indicators be in the everyday UI?

---

## 15. Non-Goals for Initial UI

Do not prioritize initially:

- Social sharing.
- Public profiles.
- Streaks.
- Mood charts.
- AI psychological summaries.
- Complex graph visualization as default.
- Calendar-first browsing.
- Map-first browsing.
- Cloud collaboration.
- Rich text formatting beyond what memory readability requires.
- Long-form writing tools that turn the app into a generic notes app.

---

## 16. Summary

The Memory Palace UI should make the product feel intelligent but not eager, organized but not rigid, private but not paranoid, simple but not shallow.

The core interaction model is:

```text
Capture:
A blank page.

Explore:
A set of doors.

Memory detail:
A page with threads.

Review:
A quiet inbox.

Settings:
A control room.
```

The most important product rule is:

> The memory always gets saved before the app asks anything else.

The most important explorer rule is:

> The app may suggest paths, but it must explain every path.

Build the interface around those two rules and the product will feel coherent, humane, and trustworthy.

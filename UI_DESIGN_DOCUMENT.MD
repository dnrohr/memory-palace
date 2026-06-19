# Memory Palace UI Design Document

Last updated: 2026-06-12

## 1. Design Thesis

Memory Palace should feel like a private notebook at the moment of capture, an archive box at the level of trust and durability, a museum label at the level of memory detail, and a quiet memory palace during exploration.

The product should not feel like a productivity database, quantified-self dashboard, therapy app, social journal, or visible AI assistant. Its intelligence should be present, but modest. Its structure should be useful, but never coercive.

The central design contrast is:

> Capture removes decisions. Explore offers doors.

The most important capture promise is:

> You can put this here before you understand it.

The most important explore promise is:

> You can later move through what you remembered without being overwhelmed by it.

---

## 2. Foundational Product Decisions

These should be treated as fixed design recommendations rather than open styling preferences.

### 2.1 Save before metadata

The user must be able to save a memory before adding title, date, tags, people, places, pets, chapters, emotional labels, or any other structure.

Metadata is a second-layer activity.

### 2.2 Audio is not retained by default

Voice capture should be first-class, but stored audio should be opt-in. The transcript becomes the saved memory unless the user explicitly keeps the original recording.

### 2.3 Titles are generated, not required

Do not ask for a title during capture. The app may generate a display title from the first line, local extraction, or a later user edit.

### 2.4 Explore begins with paths, not a raw list

The Explore home should present possible ways through the archive: timeline, people and pets, places, themes, chapters, unknown dates, recently added memories, and continue-from cards.

Search should be available, but it should not be the only entry point.

### 2.5 Every generated connection must explain itself

Related memories, nearby memories, chapters, clusters, and inferred associations should include plain-language explanations.

Examples:

- Connected by: Lila · cat
- Related because: old house · moving
- Nearby because: similar wording and approximate period

### 2.6 Generated structures are provisional

Generated chapters should be called `Possible chapters` until the user accepts, renames, hides, splits, merges, or rejects them.

The app should not claim to know the story of the user's life.

### 2.7 No gamification

Do not use streaks, confetti, scores, productivity badges, sentiment dashboards, or emotional trend reports as default UI.

### 2.8 Technical truth belongs in Settings

Processing modes, local/cloud status, encryption, retained audio, storage estimates, stale embeddings, and diagnostic logs should be explicit in Settings, not foregrounded during capture or exploration.

---

## 3. Product Posture

The app should combine four postures:

| App Layer | Posture | Meaning |
|---|---|---|
| Capture | Private notebook | Put the fragment down quickly and safely. |
| Storage/trust | Archive box | The memory is durable, local, exportable, and not overwritten. |
| Memory detail | Museum label | The memory is worth reading and contextualizing. |
| Explore | Memory palace | The user can move through associative rooms and paths. |

Avoid these postures:

| Avoid | Reason |
|---|---|
| AI assistant | Feels intrusive and over-eager. |
| Productivity dashboard | Makes memory feel like work. |
| Therapy app | Implies diagnosis or emotional authority. |
| Social feed | Violates privacy tone. |
| CRM/database | Makes people, pets, and places feel sterile. |
| Quantified-self app | Encourages analysis instead of recollection. |

---

## 4. Navigation Model

### 4.1 Recommended shell

Use a minimal bottom navigation with a central capture action:

```text
Explore        +        Review        Settings
```

Where:

- `Explore` is the default browsing surface.
- `+` opens New Memory from anywhere.
- `Review` contains optional suggestion cleanup.
- `Settings` contains privacy, portability, security, and diagnostics.

This is preferable to a four-tab model because capture should feel like the primary action, not simply one section among many.

### 4.2 Navigation rules

- Capture must be globally available.
- Explore pages should support back navigation.
- Deep Explore paths should show subtle breadcrumbs.
- Destructive actions should not be gesture-only.
- Settings should not interrupt emotional workflows.
- The user should always have a visible way out.

Example breadcrumb:

```text
Explore → Places → Old house → A sunny window
```

---

## 5. Visual System

### 5.1 Desired aesthetic

The interface should feel like:

> private notebook + archive box + museum wall label

The app should be spare, warm, readable, and quiet.

### 5.2 Color

Use a restrained palette.

Recommended light theme:

- Background: warm off-white.
- Primary surface: slightly lighter or cleaner card surface.
- Primary text: near-black, not pure black if possible.
- Secondary text: muted gray-brown.
- Tags: low-saturation warm gray, sage, clay, or blue-gray.
- Inferred metadata: softer/lighter treatment.
- Confirmed metadata: normal treatment.

Recommended dark theme:

- Background: dark charcoal, not pure black.
- Primary surface: slightly raised charcoal.
- Primary text: warm off-white.
- Secondary text: muted gray.
- Tags: low-saturation dark pills with readable text.

Avoid:

- bright gradients,
- neon AI accents,
- gamified color bursts,
- excessive semantic colors.

### 5.3 Typography

Recommended approach:

- Use a humanist sans-serif for UI.
- Consider a readable serif or highly readable humanist sans for memory body text.
- Use large line height for memory text.
- Keep metadata smaller and quieter.
- Avoid dense UI typography.

Suggested hierarchy:

| Element | Treatment |
|---|---|
| Memory body | Largest comfortable reading text, generous line height |
| Memory title | Medium-large, quiet |
| Section headers | Small, semibold |
| Metadata | Small, muted |
| Tags | Small pill labels |
| Connection reasons | Small but readable |

### 5.4 Density

Density should vary by context:

| Screen | Density |
|---|---|
| Capture | Very sparse |
| Recording | Very sparse |
| Transcript review | Sparse |
| Explore home | Medium-sparse |
| Timeline | Medium |
| Memory detail | Reading-first |
| Review | Medium |
| Settings | Dense only in advanced sections |

### 5.5 Iconography

Use minimal line icons only where they clarify navigation or actions.

Good uses:

- microphone,
- search,
- lock,
- export,
- settings,
- tag,
- person,
- place,
- timeline.

Avoid decorative icons and AI sparkle motifs.

---

## 6. Capture Design

Capture is the core emotional surface. The user's memory may be fragmentary, vulnerable, embarrassing, tender, boring, funny, or incomplete. The UI must not make the user organize it before saving it.

### 6.1 Capture screen layout

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

### 6.2 Capture behavior

Required behavior:

- Text area is primary.
- Voice button is prominent but calm.
- Save becomes available once text exists or a transcript exists.
- Autosave draft locally.
- Do not require a title.
- Do not require tags.
- Do not require dates.
- Do not display AI status.
- Do not display emotional analysis.

### 6.3 Voice recording

Recording state:

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

Recommendation:

- Use tap-to-record / tap-to-stop as the default.
- Optionally support hold-to-record later.
- Use a timer and soft waveform/pulse.
- Avoid harsh red full-screen recording UI.
- Use haptics instead of sound.
- Always offer typed fallback.

### 6.4 Transcript review

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

Rules:

- The transcript should be editable.
- The user should be able to save an imperfect transcript.
- Audio retention is opt-in.
- The app should not make transcript cleanup feel like a task.

### 6.5 Post-save suggestions

Only after the memory is saved should the app offer structure.

```text
┌─────────────────────────────────────┐
│ Saved privately                     │
│                                     │
│ I found a few possible details.     │
│                                     │
│ Date                                │
│ around 1994              [Confirm]  │
│                                     │
│ Tags                                │
│ childhood   dog   cat   Lila        │
│                                     │
│ [ Review now ]      [ Later ]       │
└─────────────────────────────────────┘
```

Rules:

- Suggestions appear in a sheet, not as a required step.
- `Later` sends suggestions to Review.
- User-confirmed metadata wins.
- Rejected suggestions should be remembered where possible.

---

## 7. Explore Design

Explore should help the user move through the archive without making them feel trapped inside it.

### 7.1 Explore home

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

### 7.2 Explore home rules

- Search is visible but not dominant.
- The user should not need to know what they are looking for.
- Continue cards resume recent paths.
- Unknown dates should be an entry point, not an error state.
- Recently added memories should be easy to revisit.
- The screen should feel like a set of doors.

### 7.3 Search

Search modes:

- Keyword.
- Nearby meaning.
- Tags.
- Date filters.

Search should be search-first, not inventory-first. The default Explore surface should show the search input, any selected filters as removable chips, and only a small set of high-signal suggested filters from local memory data. While the user types, suggestions should be grouped and compact, with tag-backed People, Places, and Tags suggestions, date precision suggestions, and text snippets when they add useful context.

The full tag/date inventory should live behind an explicit advanced filter or tune control. It remains available for deliberate browsing, but it should not be the first thing the user has to parse.

Recommended labels:

- `Search memories, people, places, tags...`
- `Keyword`
- `Nearby`
- `Advanced filters`

Avoid:

- vector search,
- embedding result,
- similarity score,
- AI-ranked.

Search result explanations:

- Matched text.
- Matched tag.
- Similar wording.
- Same period.
- Same person/place/pet.

---

## 8. Memory Cards and Detail

### 8.1 Memory card

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

Rules:

- Show title/display title.
- Show date certainty.
- Show one excerpt.
- Show 3–5 tags/entities.
- Do not show confidence scores.
- Do not show sentiment labels by default.
- Keep actions secondary.

### 8.2 Memory detail page

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

Rules:

- The original memory text is visually primary.
- Addenda are separate from the original.
- Related memories are visible and explained.
- Tags/entities are navigable.
- Editing controls are available but not dominant.

---

## 9. Timeline

The timeline should not be a calendar. It should be a loose chronology that respects memory uncertainty.

### 9.1 Timeline layout

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

### 9.2 Date certainty treatment

| Date type | Treatment |
|---|---|
| Confirmed exact | normal text |
| Confirmed approximate | normal text with approximate wording |
| Inferred | softer text or dotted underline |
| Range | bracket/range pill |
| Unknown | graceful dedicated section |

Unknown dates must not look broken.

---

## 10. People, Pets, and Places

### 10.1 Entity pages

Entity pages should feel like constellations, not CRM records.

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

### 10.2 Place pages

Places should feel atmospheric.

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

- Show memory count quietly.
- Show recurring details.
- Show approximate time period where known.
- Avoid map-first UI unless the user explicitly adds location data.
- Rename/merge controls should live behind an unobtrusive menu.

---

## 11. Themes and Tags

Themes should be shown as readable shelves, not as a graph by default.

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

Recommendation:

- Use tag graph data to create theme cards.
- Keep literal graph visualization optional.
- Add graph view only after theme cards are useful.
- Prefer clarity over visual novelty.

---

## 12. Chapters

Chapters can become the signature Explore feature, but they must remain user-editable and provisional.

### 12.1 Chapter card

```text
┌─────────────────────────────────────┐
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

### 12.2 Chapter detail

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

- Generated chapters are `Possible chapters`.
- User can rename, hide, split, merge, or reject.
- User-defined chapters outrank generated chapters.
- The app should never present a generated chapter as the definitive narrative.

---

## 13. Review

Review is a quiet maintenance inbox.

### 13.1 Review layout

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

### 13.2 Review tone

Use:

- possible details,
- review when you want,
- accept,
- edit,
- dismiss,
- later.

Avoid:

- incomplete,
- needs attention,
- fix,
- missing,
- required.

### 13.3 Review item types

Support:

- suggested tags,
- suggested dates,
- suggested people,
- suggested pets,
- suggested places,
- untagged memories,
- chapter candidates,
- duplicate tags,
- import conflicts.

Review must never block capture or exploration.

---

## 14. Settings

Settings should be explicit, plain, and boring.

Recommended sections:

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

### 14.1 Privacy

Show:

- data storage location,
- whether cloud sync is enabled,
- whether cloud AI is enabled,
- whether local suggestions are enabled,
- whether local embeddings/search are enabled,
- whether audio retention is enabled.

### 14.2 Export/import

Export options:

- JSON,
- Markdown,
- SQLite dump,
- backup bundle.

Import options:

- JSON,
- Markdown,
- backup bundle when available.

### 14.3 Storage

Show:

- active memories,
- deleted memories,
- tags,
- retained audio,
- embeddings,
- processing logs,
- stale embedding queue,
- estimated local storage.

Diagnostics should be available but visually separated from ordinary use.

---

## 15. Animation and Motion

Motion should create continuity and reassurance, not entertainment.

### 15.1 Recommended animations

| Interaction | Animation |
|---|---|
| Open capture | soft sheet rise or fade |
| Start recording | gentle pulse/waveform |
| Stop recording | waveform settles |
| Save memory | brief settled confirmation |
| Show suggestions | bottom sheet rise |
| Open memory | card-to-detail transition if feasible |
| Move between related memories | gentle slide/crossfade |
| Dismiss review card | card collapse |
| Open entity/tag/chapter | horizontal path transition |

### 15.2 Avoid

- confetti,
- bouncy gamification,
- aggressive red recording transitions,
- sparkle effects,
- excessive AI loading states,
- motion that makes browsing feel theatrical.

### 15.3 Haptics and sound

Recommendation:

- Use light haptics for record start, record stop, save, and dismiss.
- Do not use sound by default.
- If sound exists, make it opt-in and extremely subtle.
- No ambient sound.
- No celebratory chimes.

---

## 16. Gestures

Use gestures carefully.

Recommended:

- Tap tag/entity/place/chapter to traverse.
- Long-press memory card for contextual actions.
- Swipe review card to dismiss or defer.
- Native back swipe where available.
- Drag-to-reorder only in explicit editing contexts.

Avoid:

- swipe-to-delete without confirmation,
- hidden privacy/export gestures,
- complex graph gestures as primary navigation,
- destructive long-press actions without confirmation.

---

## 17. Library and Implementation Recommendations

These are implementation-direction recommendations rather than hard requirements.

### 17.1 UI implementation posture

Use mostly custom components built on React Native/Expo primitives rather than adopting a heavy visual UI kit.

Reason: the emotional tone is specific. Generic kits may make the app feel like SaaS, productivity software, or a settings app.

### 17.2 Recommended libraries / capabilities

| Need | Recommendation |
|---|---|
| App framework | Expo / React Native |
| Local database | expo-sqlite |
| Audio recording | Expo audio APIs |
| Document import/export | expo-document-picker, expo-file-system, expo-sharing |
| App lock / biometrics | expo-local-authentication plus secure key storage |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Special visuals | @shopify/react-native-skia, only where needed |
| Component development | internal component gallery or Storybook-style workflow |
| State/data access | small service layer over archive operations; avoid UI directly owning persistence details |

### 17.3 Skia usage

Use Skia selectively for:

- recording waveform,
- optional graph visualization,
- soft constellation/chapter visuals,
- custom timeline embellishments.

Do not build ordinary UI controls in Skia.

### 17.4 Component system

Build these core components first:

- `AppShell`
- `CenterCaptureButton`
- `ScreenHeader`
- `BreadcrumbTrail`
- `MemoryCard`
- `MemoryDetail`
- `TagPill`
- `DateCertaintyLabel`
- `ConnectionReason`
- `PostSaveSuggestionSheet`
- `ReviewCard`
- `EntityCard`
- `ChapterCard`
- `ThemeClusterCard`
- `SettingsSection`

---

## 18. Platform Layout

### 18.1 Mobile

Mobile should be single-column.

- Capture: full-screen or near-full-screen sheet.
- Explore: stacked navigation.
- Memory detail: full screen.
- Related memories: below memory text.
- Settings: grouped list.

### 18.2 Tablet

Tablet can use two-pane layouts.

```text
[Memory list / path]   [Memory detail]
```

### 18.3 Desktop / Web

Desktop can use two- or three-pane layouts.

```text
[Explore mode]   [Memory list]   [Memory detail]
```

Rules:

- Do not force desktop density onto mobile.
- Keep capture focused on all platforms.
- Use side rails for related memories only when there is room.

---

## 19. Emotional Safety

The app should not ambush the user with painful memories.

### 19.1 Recommended controls

Add:

- Mark memory as sensitive.
- Show less like this.
- Exclude from resurfacing.
- Exclude tag/person/place/pet/chapter from resurfacing.
- Hide chapter.
- Dismiss related memory suggestion.
- Disable `On this day`.

### 19.2 Resurfacing

Recommendation:

- Do not enable `On this day` by default.
- Do not push surprise memories aggressively.
- Make resurfacing opt-in or very gentle.
- Never show emotional conclusions as notifications.

Bad notification:

> You seemed sad in memories from this week.

Better:

> A memory from this period is available to revisit.

Even that should be opt-in.

---

## 20. Microcopy System

### 20.1 Preferred words

Use:

- memory,
- fragment,
- addendum,
- possible,
- suggested,
- confirmed,
- nearby,
- connected by,
- review later,
- saved privately,
- keep original,
- approximate date,
- unknown date,
- possible chapter.

### 20.2 Avoid

Avoid:

- submit,
- required,
- incomplete,
- fix,
- missing,
- metadata,
- entity extraction,
- vector search,
- embedding score,
- AI-generated emotion,
- sentiment trend,
- optimize,
- analyze,
- productivity,
- streak.

### 20.3 Tone

The tone should be:

- plain,
- gentle,
- direct,
- non-clinical,
- non-therapeutic,
- non-corporate,
- non-gamified.

---

## 21. First Design Prototype

The first UI prototype should include only enough to validate the core feeling.

### 21.1 Prototype scope

Build:

1. App shell with center capture button.
2. New Memory screen.
3. Typed capture save.
4. Voice capture mock or real wrapper.
5. Transcript review.
6. Post-save suggestion sheet.
7. Explore home.
8. Memory cards.
9. Memory detail with nearby memories.
10. Timeline.
11. Review inbox.
12. Settings privacy/export skeleton.

### 21.2 Prototype goals

Validate:

- Does capture feel low-pressure?
- Does voice feel private?
- Does post-save suggestion feel helpful rather than intrusive?
- Does Explore feel like paths rather than a database?
- Does the user understand why memories are connected?
- Does Review feel optional?
- Does Settings communicate trust?

---

## 22. Design Acceptance Criteria

### 22.1 Capture

- User can save a memory without title/date/tags.
- User can save before suggestions.
- User understands audio is not kept unless chosen.
- User can recover from voice/transcription failure.
- User does not feel like they are filling out a form.

### 22.2 Explore

- User can find a known memory.
- User can drift from one memory to another.
- User can browse without using search.
- User understands approximate and unknown dates.
- User can see why related memories appear.
- User can back out of any path.

### 22.3 Review

- User understands suggestions are optional.
- User can accept, edit, dismiss, or defer.
- Review does not feel like a chore list.
- Rejected suggestions do not repeatedly return.

### 22.4 Settings

- User understands where data lives.
- User understands export options.
- User understands audio retention.
- User understands local/cloud processing state.
- Advanced diagnostics are present but not intrusive.

---

## 23. Final Recommendation

Build Memory Palace as a quiet, local-first memory archive with a UI that privileges emotional permission over visible intelligence.

The app should not say:

> I analyzed your life.

It should say:

> I kept what you gave me, and here are some paths through it.

The strongest design rules are:

1. Save first.
2. Organize later.
3. Explain every connection.
4. Keep generated structures provisional.
5. Never gamify memory.
6. Never make the user feel diagnosed.
7. Make privacy visible through behavior.
8. Make exploration feel like wandering with a thread.

Your roadmap already has a strong **trust architecture**: local-first, exportable, no cloud requirement, user-confirmed metadata, raw text never overwritten, optional AI, and correction/addendum workflows. For the *inputting memories* UI, I’d treat that not as “data entry,” but as a **small private room for disclosure**. The best UI should make the user feel: **safe, unjudged, unhurried, in control, and gently held**. The roadmap’s product principles support that technically; the UI needs to make those principles emotionally obvious. 

## The feeling target

The memory-input flow should feel less like:

> “Fill out this form correctly.”

And more like:

> “Say the thing while it is still alive. We can organize it later.”

That distinction matters. Memories are often fragmentary, embarrassing, tender, boring, funny, imprecise, or emotionally charged. The input UI should not immediately interrogate the user with metadata fields. It should create permission to be incomplete.

The emotional promise should be:

> **You can put this here without having to understand it yet.**

## Design principles for the capture UI

### 1. Capture first, structure second

The current roadmap emphasizes suggestions, tags, dates, review inboxes, and metadata confirmation. That is good system design. But in the input UI, metadata should be **secondary and deferred**.

The ideal first screen is almost nothing:

* A large text field.
* A voice button.
* A save button.
* Maybe one soft prompt.
* No visible tag/date machinery unless the user asks for it.

The user should never feel like they need to classify the memory before saving it.

A good default flow:

1. Open app.
2. Tap “New memory.”
3. Speak or type.
4. Tap “Save.”
5. App says, essentially: saved privately.
6. Then, optionally: “I found a possible date and a few tags. Review now or later?”

The “later” option is important. It preserves the sacredness of capture.

### 2. Make the app feel private before explaining privacy

Because your roadmap has strong privacy commitments, the UI can express privacy without legalistic copy.

Instead of a settings-style disclosure up front, use small ambient cues:

> Saved on this device
> No account required
> Audio not kept unless you choose
> Suggestions are optional

Do not overload the capture screen with privacy text. The user should feel privacy through quietness, lack of clutter, and absence of social/cloud/account affordances.

### 3. Reduce the fear of writing badly

Most people will not enter memories if the app makes them feel like they are composing literature.

The UI should make roughness feel acceptable. Use language like:

* “Start anywhere.”
* “A fragment is enough.”
* “You can clean this up later.”
* “Save as-is.”

Avoid labels like:

* “Title”
* “Description”
* “Required fields”
* “Submit”
* “Entry metadata”

“Submit” especially feels wrong. The user is not submitting to an authority.

Use **Save**, **Keep**, or **Place in archive**.

### 4. Make voice feel like the primary ritual, not a gimmick

Since the concept began with speaking memories, the voice UI should be beautiful and central.

The record state should be calm:

* One large circular button.
* Gentle waveform or pulsing ring.
* Clear elapsed time.
* A prominent stop button.
* No aggressive red “recording” interface unless necessary.

After recording, the transcript screen should not feel like an error-correction chore. It should feel like:

> “Here is what I heard. Fix only what matters.”

Possible post-recording controls:

* **Save transcript**
* **Edit first**
* **Keep audio?** off by default, with a short explanation
* **Discard**

Do not force the user through tag/date confirmation before saving.

### 5. Separate “memory” from “note”

This is subtle but important. A generic notes app asks: “What do you want to write?” A memory app asks: “What came back to you?”

The capture UI should privilege recalled experience over productivity.

Good prompt examples:

* “What came back?”
* “What do you remember?”
* “Start with the image.”
* “Who was there?”
* “Where are you in the memory?”
* “What detail still feels vivid?”

But prompts should be optional and quiet. The app should not become therapy homework.

## Suggested input flow

I would design the input experience around three modes, but make them feel like one simple composer.

### Default: fast capture

The default “New Memory” screen:

```text
What came back?

[ large empty writing area ]

        Hold to speak

Save
```

Below, maybe in faint text:

```text
You can add dates and tags later.
```

That one sentence removes pressure.

### After save: gentle confirmation

After saving:

```text
Saved privately.

Possible tags: childhood, dog, apartment, Lila
Possible date: around 1994

[Review] [Later]
```

This is where your extraction pipeline appears, but only after the memory is safe.

### Expanded details: optional drawer

For users who want control immediately, provide an “Add details” drawer:

* Approximate date
* People
* Places
* Pets
* Tags
* Emotional tone
* Keep audio toggle
* Private note / correction

But it should be hidden by default.

## Visual language

I would avoid a productivity-app look. No dense cards, no bright gradients, no dashboard energy during capture.

The visual language should be:

* Warm neutral background.
* Large typography.
* High line spacing.
* Very few buttons.
* Soft transitions.
* No gamification.
* No streaks.
* No “memory score.”
* No celebratory confetti.
* No AI sparkle icon as a primary element.

The app should feel closer to a **field recorder + notebook + archive box** than to Notion, Evernote, or a journaling wellness app.

Beautiful here means **restraint**.

## Microcopy matters a lot

I would be very careful with labels.

Use:

* **Memory**
* **Fragment**
* **Addendum**
* **Approximate date**
* **Suggested tags**
* **Review later**
* **Keep original**

Avoid:

* “AI-generated”
* “Entity extraction”
* “Metadata”
* “Processing”
* “Optimize”
* “Analyze emotion”
* “Complete entry”

The roadmap already has structured extraction, embeddings, review inboxes, and graphs. Those are powerful, but the capture UI should hide the machinery.

A memory should not feel “processed” at the moment of disclosure.

## The most important UI rule

Never block saving.

Even if transcription fails, metadata fails, date parsing fails, tag extraction fails, or app lock is unavailable, the user should be able to save raw text.

Your roadmap already says raw memory text is canonical and model output cannot corrupt it. The UI should embody that with a hard product rule:

> **The memory always gets saved before the app asks anything else.**

That one rule would make the whole input experience feel humane.

## A concrete capture-screen concept

Something like this:

```text
New memory

What came back?

[                                                     ]
[                                                     ]
[                                                     ]
[                                                     ]

Hold to speak

A fragment is enough. Dates and tags can wait.

[Save]
```

While recording:

```text
Listening...

00:43

[Stop]

No audio is kept unless you choose to keep it.
```

After transcription:

```text
Here is what I heard.

[ editable transcript ]

[Save memory]

Optional:
[ ] Keep original audio
```

After save:

```text
Saved.

I found a few possible details:
1994 · dog · cat · Lila · old house

[Review details] [Later]
```

That is simple, but it creates the right hierarchy: **memory first, archive second, intelligence third**.

## My strongest recommendation

Make the core capture UI almost aggressively minimal, and move all intelligence into a second layer.

Your app’s durable value is the archive, but the user’s moment of need is capture. The user should feel that the app is saying:

> “Don’t organize. Don’t perform. Don’t explain. Just put it here.”

That is the environment I would optimize for.

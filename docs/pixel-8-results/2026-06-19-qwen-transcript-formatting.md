# Pixel 8a Qwen Transcript Formatting QA

Date: 2026-06-19

Device: Pixel 8a, Android 16

Android package: `com.anonymous.memorypalace`

Build under test: `bd5a5d8` plus follow-up preservation and retry-prompt changes from this QA pass

Connection mode: USB / ADB

## Scope

Manual device QA for the Qwen-powered `Format transcript` action in the new-memory typed draft flow and voice transcript review flow. This pass did not clear app data.

## Local Gate

- `npm run build`: pass
- `npm test`: pass
- `git diff --check`: pass with the repository's existing CRLF normalization warnings

## Device Gate

- `npm run pixel8:install-standalone`: pass
- `adb shell monkey -p com.anonymous.memorypalace 1`: pass; app launched without a red error screen
- Typed new-memory draft formatting: pass
  - Input: `in 2004 maya and i went to queens`
  - Result: `In 2004, Maya and I went to Queens.`
  - The formatted draft remained editable and save stayed enabled.
- Voice transcript review formatting safety: pass
  - Input: `my grandma lived in queens and we went there in 2004`
  - Qwen attempted a shortened result during QA.
  - The app preserved the original editable draft and showed `Qwen transcript formatting failed. Your draft was not changed.`
- Typed retry formatting for the same preservation edge: pass
  - Input: `my grandma lived in queens and we went there in 2004`
  - Result after the stricter Qwen retry prompt: `My grandma lived in Queens and we went there in 2004.`
  - The formatted draft remained editable and save stayed enabled.

## Findings

- Device QA found a stale-state notice bug after successful typed formatting. The typed flow replaced the draft but displayed the "draft changed" notice. This pass fixed the UI guard to use refs for the latest editable text before setting the final notice.
- Device QA found Qwen can return a semantically shortened transcript even with the narrow prompt. This pass added a processing-layer word-sequence guard so punctuation/capitalization-only results can apply, while dropped or rewritten words fail non-destructively.
- Device QA then found the visible unformatted draft was awkward when Qwen's first answer shortened the transcript. This pass added a Qwen-only retry prompt that uses the original transcript and required word sequence, with no rules-based fallback.
- No rules-based fallback formatting was added.

## Deferred

- Qwen unavailable messaging was covered by automated adapter behavior and UI wiring review, but was not manually reverified on-device because this Pixel 8a already had Qwen assets imported and app data was not cleared.
- Broader Pixel regression coverage, saved-memory persistence, search, export, and settings sweeps were not part of this targeted QA pass.
- No screenshots were created.

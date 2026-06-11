# Processing Pipeline Contract v0.1

Processing is advisory. It can create suggestions and processing history, but it must not silently overwrite canonical user decisions.

## Input

```ts
type MemoryProcessingInput = {
  memoryId?: string;
  rawText: string;
  cleanedText?: string;
  userProfile?: {
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
  };
  knownTags?: Tag[];
};
```

## Output

```ts
type MemoryProcessingResult = {
  cleanedText: string;
  dateCandidates: DateCandidate[];
  tagSuggestions: TagSuggestion[];
  processingRuns: ProcessingRunRecord[];
};
```

## Rules

- Preserve `rawText`.
- Return suggestions with source and confidence.
- Keep explicit suggestions separate from inferred suggestions.
- Never promote model output to confirmed metadata.
- Make date uncertainty visible through precision and explanation.
- Store enough processor metadata to rerun and debug extraction changes.

## MVP Pipeline

```text
raw text
  -> conservative cleanup
  -> rules-based date extraction
  -> rules-based tag suggestion
  -> user confirmation UI
  -> persistence and search indexing
```


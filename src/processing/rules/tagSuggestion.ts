import type { TagSuggestion, TagType } from "../../core/types";
import type { ITagSuggestionEngine, MemoryProcessingInput } from "../contracts";

const TERM_TAGS: Array<{ pattern: RegExp; name: string; type: TagType; confidence: number }> = [
  { pattern: /\bdogs?\b/i, name: "dog", type: "theme", confidence: 0.86 },
  { pattern: /\bcats?\b|\btabby\b/i, name: "cat", type: "theme", confidence: 0.86 },
  { pattern: /\bpets?\b|\bdog\b|\bcat\b/i, name: "pet", type: "theme", confidence: 0.72 },
  { pattern: /\banimal shelter\b/i, name: "animal shelter", type: "place", confidence: 0.82 },
  { pattern: /\bold house\b/i, name: "old house", type: "place", confidence: 0.8 },
  { pattern: /\bapartment\b/i, name: "apartment", type: "place", confidence: 0.76 },
  { pattern: /\bhome\b|\bhouse\b|\bapartment\b/i, name: "home", type: "place", confidence: 0.76 },
  { pattern: /\bcollege\b|\buniversity\b|\bcampus\b/i, name: "college", type: "life_period", confidence: 0.78 },
  { pattern: /\bschools?\b|\bclassroom\b|\bteacher\b|\bgrade\b/i, name: "school", type: "life_period", confidence: 0.74 },
  { pattern: /\broommate\b/i, name: "roommate", type: "theme", confidence: 0.7 },
  { pattern: /\bjob\b|\bwork\b|\bworked\b|\boffice\b|\bboss\b|\bcoworker\b/i, name: "work", type: "activity", confidence: 0.72 },
  { pattern: /\bvacation\b/i, name: "vacation", type: "activity", confidence: 0.76 },
  { pattern: /\bvacation\b|\btrip\b|\btravel(?:ed|ing)?\b|\bflight\b|\bhotel\b/i, name: "travel", type: "activity", confidence: 0.74 },
  { pattern: /\bbirthday\b|\bparty\b/i, name: "celebration", type: "activity", confidence: 0.73 },
  { pattern: /\bwedding\b|\bmarried\b|\bmarriage\b/i, name: "wedding", type: "activity", confidence: 0.78 },
  { pattern: /\bmoved\b|\bmoving\b|\bmove\b/i, name: "moving", type: "activity", confidence: 0.73 },
  { pattern: /\bhospital\b|\bsurgery\b|\bdoctor\b|\billness\b|\bsick\b|\btherapy\b/i, name: "health", type: "theme", confidence: 0.72 },
  { pattern: /\bmother\b|\bfather\b|\bmom\b|\bdad\b|\bsister\b|\bbrother\b|\bfamily\b|\bgrandma\b|\bgrandpa\b/i, name: "family", type: "theme", confidence: 0.75 },
  { pattern: /\bfriend\b|\bfriends\b|\bbest friend\b/i, name: "friends", type: "theme", confidence: 0.72 },
  { pattern: /\bgrief\b|\bdied\b|\blost\b|\bfuneral\b/i, name: "grief", type: "emotion", confidence: 0.76 },
  { pattern: /\bhappy\b|\bjoy\b|\bexcited\b|\bproud\b/i, name: "joy", type: "emotion", confidence: 0.68 },
  { pattern: /\bscared\b|\bafraid\b|\banxious\b|\bnervous\b/i, name: "anxiety", type: "emotion", confidence: 0.68 }
];

const COMMON_CAPITALIZED_EXCLUSIONS = new Set([
  "I",
  "We",
  "When",
  "The",
  "A",
  "An",
  "In",
  "On",
  "At",
  "My",
  "Our",
  "This",
  "That",
  "Then",
  "After",
  "Before",
  "Because",
  "Today",
  "Yesterday"
]);

export type TagSuggestionOptions = {
  rejectedNames?: string[];
};

export class RulesTagSuggestionEngine implements ITagSuggestionEngine {
  async suggestTags(input: MemoryProcessingInput): Promise<TagSuggestion[]> {
    return suggestTags(input.rawText);
  }
}

export function suggestTags(text: string, options: TagSuggestionOptions = {}): TagSuggestion[] {
  const suggestions: TagSuggestion[] = [];
  const rejectedNames = new Set((options.rejectedNames ?? []).map(normalizeSuggestionName));

  for (const term of TERM_TAGS) {
    if (term.pattern.test(text)) {
      suggestions.push({
        name: term.name,
        type: term.type,
        confidence: term.confidence,
        source: "explicit",
        explanation: `Matched "${term.name}" in memory text.`
      });
    }
  }

  for (const name of extractExplicitTags(text)) {
    suggestions.push({
      name,
      type: "custom",
      confidence: 0.92,
      source: "explicit",
      explanation: `Matched explicit tag "${name}".`
    });
  }

  for (const name of extractCapitalizedNames(text)) {
    suggestions.push({
      name,
      type: inferNameType(text, name),
      confidence: 0.68,
      source: "explicit",
      explanation: `Matched capitalized name "${name}".`
    });
  }

  return dedupeSuggestions(suggestions).filter((suggestion) => !rejectedNames.has(normalizeSuggestionName(suggestion.name)));
}

function extractCapitalizedNames(text: string): string[] {
  const matches = [
    ...(text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) ?? []),
    ...(text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [])
  ];
  return [...new Set(matches)].filter((name) => {
    const firstWord = name.split(/\s+/)[0] ?? name;
    return !COMMON_CAPITALIZED_EXCLUSIONS.has(firstWord);
  });
}

function extractExplicitTags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? [];
  return matches.map((tag) => tag.slice(1).replace(/[_-]+/g, " ").trim().toLocaleLowerCase()).filter(Boolean);
}

function inferNameType(text: string, name: string): TagType {
  const nearbyPetPattern = new RegExp(
    `(?:dog|cat|pet|tabby)\\s+${name}|${name}.*\\b(?:dog|cat|pet|tabby)\\b|\\bnamed\\s+(?:him|her|it)\\s+${name}\\b`,
    "i"
  );
  if (nearbyPetPattern.test(text)) return "pet";
  return "person";
}

function dedupeSuggestions(suggestions: TagSuggestion[]): TagSuggestion[] {
  const byName = new Map<string, TagSuggestion>();

  for (const suggestion of suggestions) {
    const key = suggestion.name.toLocaleLowerCase();
    const existing = byName.get(key);
    if (!existing || suggestion.confidence > existing.confidence) {
      byName.set(key, suggestion);
    }
  }

  return [...byName.values()].sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function normalizeSuggestionName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

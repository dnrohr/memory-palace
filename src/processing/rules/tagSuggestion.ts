import type { TagSuggestion, TagType } from "../../core/types";
import type { ITagSuggestionEngine, MemoryProcessingInput } from "../contracts";

const TERM_TAGS: Array<{ pattern: RegExp; name: string; type: TagType; confidence: number }> = [
  { pattern: /\bdogs?\b/i, name: "dog", type: "theme", confidence: 0.86 },
  { pattern: /\bcats?\b|\btabby\b/i, name: "cat", type: "theme", confidence: 0.86 },
  { pattern: /\bpets?\b|\bdog\b|\bcat\b/i, name: "pet", type: "theme", confidence: 0.72 },
  { pattern: /\banimal shelter\b/i, name: "animal shelter", type: "place", confidence: 0.82 },
  { pattern: /\bold house\b/i, name: "old house", type: "place", confidence: 0.8 },
  { pattern: /\bapartment\b/i, name: "apartment", type: "place", confidence: 0.76 },
  { pattern: /\bcollege\b/i, name: "college", type: "life_period", confidence: 0.78 },
  { pattern: /\bschools?\b|\bclassroom\b|\bteacher\b/i, name: "school", type: "life_period", confidence: 0.74 },
  { pattern: /\broommate\b/i, name: "roommate", type: "theme", confidence: 0.7 },
  { pattern: /\bjob\b|\bwork\b|\bworked\b/i, name: "work", type: "activity", confidence: 0.72 },
  { pattern: /\bvacation\b|\btrip\b/i, name: "travel", type: "activity", confidence: 0.74 },
  { pattern: /\bbirthday\b|\bparty\b/i, name: "celebration", type: "activity", confidence: 0.73 },
  { pattern: /\bwedding\b|\bmarried\b|\bmarriage\b/i, name: "wedding", type: "activity", confidence: 0.78 },
  { pattern: /\bmoved\b|\bmoving\b|\bmove\b/i, name: "moving", type: "activity", confidence: 0.73 },
  { pattern: /\bhospital\b|\bsurgery\b|\bdoctor\b/i, name: "health", type: "theme", confidence: 0.72 },
  { pattern: /\bmother\b|\bfather\b|\bmom\b|\bdad\b|\bsister\b|\bbrother\b|\bfamily\b/i, name: "family", type: "theme", confidence: 0.75 },
  { pattern: /\bgrief\b|\bdied\b|\blost\b|\bfuneral\b/i, name: "grief", type: "emotion", confidence: 0.76 }
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
  "Our"
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
  const matches = text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  return matches.filter((name) => !COMMON_CAPITALIZED_EXCLUSIONS.has(name));
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

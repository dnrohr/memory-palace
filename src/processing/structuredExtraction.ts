import type { DateCandidate, TagSuggestion } from "../core/types";
import type { LifeContext } from "../core/lifeContext";
import { extractDateCandidates } from "./rules/dateExtraction";
import { suggestTags } from "./rules/tagSuggestion";

export type StructuredExtractionInput = {
  text: string;
  context?: LifeContext;
};

export type StructuredExtractionResult = {
  title?: string;
  dates: DateCandidate[];
  tags: TagSuggestion[];
  emotionalTone: TagSuggestion[];
  engineId: string;
  engineVersion: string;
  schemaVersion: "structured-extraction.v1";
  promptVersion?: string;
};

export type StructuredExtractionValidation = {
  valid: boolean;
  warnings: string[];
};

export interface IStructuredExtractionEngine {
  id: string;
  displayName: string;
  runsLocally: boolean;
  extract(input: StructuredExtractionInput): Promise<StructuredExtractionResult>;
}

export class NoStructuredExtractionEngine implements IStructuredExtractionEngine {
  id = "none";
  displayName = "No structured extraction";
  runsLocally = true;

  async extract(_input: StructuredExtractionInput): Promise<StructuredExtractionResult> {
    return {
      dates: [],
      tags: [],
      emotionalTone: [],
      engineId: this.id,
      engineVersion: "0.1.0",
      schemaVersion: "structured-extraction.v1"
    };
  }
}

export class RulesStructuredExtractionEngine implements IStructuredExtractionEngine {
  id = "rules-structured";
  displayName = "Rules structured extraction";
  runsLocally = true;

  async extract(input: StructuredExtractionInput): Promise<StructuredExtractionResult> {
    const title = suggestTitle(input.text);
    return {
      ...(title ? { title } : {}),
      dates: extractDateCandidates(input.text),
      tags: suggestTags(input.text),
      emotionalTone: suggestEmotionTags(input.text),
      engineId: this.id,
      engineVersion: "0.1.0",
      schemaVersion: "structured-extraction.v1",
      promptVersion: "rules.v1"
    };
  }
}

export function validateStructuredExtractionResult(result: StructuredExtractionResult): StructuredExtractionValidation {
  const warnings: string[] = [];

  if (result.schemaVersion !== "structured-extraction.v1") {
    warnings.push("Unexpected structured extraction schema version.");
  }

  for (const date of result.dates) {
    if (date.confidence < 0 || date.confidence > 1) warnings.push(`Date candidate "${date.label}" has invalid confidence.`);
    if (!date.label.trim()) warnings.push("Date candidate is missing a label.");
  }

  for (const tag of [...result.tags, ...result.emotionalTone]) {
    if (tag.confidence < 0 || tag.confidence > 1) warnings.push(`Tag suggestion "${tag.name}" has invalid confidence.`);
    if (!tag.name.trim()) warnings.push("Tag suggestion is missing a name.");
  }

  if (!result.engineId.trim()) warnings.push("Result is missing engineId.");
  if (!result.engineVersion.trim()) warnings.push("Result is missing engineVersion.");

  return {
    valid: warnings.length === 0,
    warnings
  };
}

function suggestTitle(text: string): string | undefined {
  const firstSentence = text.trim().split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return undefined;
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}...` : firstSentence;
}

function suggestEmotionTags(text: string): TagSuggestion[] {
  const suggestions: TagSuggestion[] = [];
  const lower = text.toLocaleLowerCase();

  if (/\b(grief|died|lost|death)\b/.test(lower)) {
    suggestions.push({
      name: "grief",
      type: "emotion",
      confidence: 0.76,
      source: "rule",
      explanation: "Matched grief-related language."
    });
  }

  if (/\b(loved|happy|joy|delighted)\b/.test(lower)) {
    suggestions.push({
      name: "joy",
      type: "emotion",
      confidence: 0.65,
      source: "rule",
      explanation: "Matched positive emotional language."
    });
  }

  return suggestions;
}

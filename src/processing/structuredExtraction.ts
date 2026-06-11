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
      engineVersion: "0.1.0"
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
      engineVersion: "0.1.0"
    };
  }
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

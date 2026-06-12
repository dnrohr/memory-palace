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

export interface ILocalStructuredExtractionModel {
  id: string;
  displayName: string;
  version: string;
  complete(prompt: string): Promise<string>;
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

export class JsonLocalModelStructuredExtractionEngine implements IStructuredExtractionEngine {
  id: string;
  displayName: string;
  runsLocally = true;

  constructor(private readonly model: ILocalStructuredExtractionModel) {
    this.id = `local-model-structured-${model.id}`;
    this.displayName = model.displayName;
  }

  async extract(input: StructuredExtractionInput): Promise<StructuredExtractionResult> {
    const raw = await this.model.complete(buildStructuredExtractionPrompt(input));
    const parsed = parseModelJson(raw);
    const result: StructuredExtractionResult = {
      ...(typeof parsed.title === "string" && parsed.title.trim() ? { title: parsed.title.trim() } : {}),
      dates: Array.isArray(parsed.dates) ? (parsed.dates as StructuredExtractionResult["dates"]) : [],
      tags: Array.isArray(parsed.tags) ? (parsed.tags as StructuredExtractionResult["tags"]) : [],
      emotionalTone: Array.isArray(parsed.emotionalTone) ? (parsed.emotionalTone as StructuredExtractionResult["emotionalTone"]) : [],
      engineId: this.id,
      engineVersion: this.model.version,
      schemaVersion: "structured-extraction.v1",
      promptVersion: "local-model-json.v1"
    };
    const validation = validateStructuredExtractionResult(result);
    if (!validation.valid) {
      throw new Error(`Local structured extraction returned invalid output: ${validation.warnings.join(" ")}`);
    }
    return result;
  }
}

export function buildStructuredExtractionPrompt(input: StructuredExtractionInput): string {
  const knownPeople = input.context?.people?.map((person) => person.displayName).join(", ") || "none";
  const knownPets = input.context?.pets?.map((pet) => pet.name).join(", ") || "none";
  const knownPlaces = input.context?.places?.map((place) => place.name).join(", ") || "none";

  return [
    "Extract provisional memory metadata as strict JSON.",
    "Return only JSON with keys: title, dates, tags, emotionalTone.",
    "Dates must include label, precision, confidence, source, and explanation when available.",
    "Tags and emotionalTone must include name, type, confidence, source, and explanation when available.",
    "Suggestions are provisional and must not rewrite the memory.",
    `Known people: ${knownPeople}`,
    `Known pets: ${knownPets}`,
    `Known places: ${knownPlaces}`,
    `Memory: ${input.text}`
  ].join("\n");
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

function parseModelJson(raw: string): Partial<StructuredExtractionResult> {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(withoutFence) as Partial<StructuredExtractionResult>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Local structured extraction returned non-object JSON.");
  }
  return parsed;
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

import type { DateCandidate, DatePrecision, SuggestionSource, TagSuggestion, TagType } from "../core/types";
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
      dates: normalizeDateCandidates(parsed.dates),
      tags: normalizeTagSuggestions(parsed.tags, "theme"),
      emotionalTone: normalizeTagSuggestions(parsed.emotionalTone, "emotion"),
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
    if (!isRecord(date)) {
      warnings.push("Date candidate is not an object.");
      continue;
    }
    const label = typeof date.label === "string" ? date.label : "";
    const confidence = typeof date.confidence === "number" ? date.confidence : Number.NaN;
    if (confidence < 0 || confidence > 1 || Number.isNaN(confidence)) warnings.push(`Date candidate "${label}" has invalid confidence.`);
    if (!label.trim()) warnings.push("Date candidate is missing a label.");
  }

  for (const tag of [...result.tags, ...result.emotionalTone]) {
    if (!isRecord(tag)) {
      warnings.push("Tag suggestion is not an object.");
      continue;
    }
    const name = typeof tag.name === "string" ? tag.name : "";
    const confidence = typeof tag.confidence === "number" ? tag.confidence : Number.NaN;
    if (confidence < 0 || confidence > 1 || Number.isNaN(confidence)) warnings.push(`Tag suggestion "${name}" has invalid confidence.`);
    if (!name.trim()) warnings.push("Tag suggestion is missing a name.");
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

function normalizeDateCandidates(value: unknown): DateCandidate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((candidate): DateCandidate | undefined => {
      if (typeof candidate === "string") return dateCandidateFromLabel(candidate);
      if (!isRecord(candidate)) return undefined;
      const label = typeof candidate.label === "string" ? candidate.label : dateLabelFromLooseCandidate(candidate);
      if (!label.trim()) return undefined;
      return {
        label: label.trim(),
        ...(typeof candidate.startDate === "string" ? { startDate: candidate.startDate } : {}),
        ...(typeof candidate.endDate === "string" ? { endDate: candidate.endDate } : {}),
        precision: isDatePrecision(candidate.precision) ? candidate.precision : inferDatePrecision(label),
        confidence: confidenceOrDefault(candidate.confidence),
        sourceText: typeof candidate.sourceText === "string" && candidate.sourceText.trim() ? candidate.sourceText : label.trim(),
        ...(typeof candidate.inferenceExplanation === "string" ? { inferenceExplanation: candidate.inferenceExplanation } : {})
      };
    })
    .filter((candidate): candidate is DateCandidate => Boolean(candidate));
}

function normalizeTagSuggestions(value: unknown, defaultType: TagType): TagSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((suggestion): TagSuggestion | undefined => {
      if (typeof suggestion === "string") return tagSuggestionFromName(suggestion, defaultType);
      if (!isRecord(suggestion)) return undefined;
      const name = typeof suggestion.name === "string" ? suggestion.name.trim() : "";
      if (!name) return undefined;
      return {
        name,
        type: isTagType(suggestion.type) ? suggestion.type : defaultType,
        confidence: confidenceOrDefault(suggestion.confidence),
        source: isSuggestionSource(suggestion.source) ? suggestion.source : "model",
        ...(typeof suggestion.explanation === "string" ? { explanation: suggestion.explanation } : {})
      };
    })
    .filter((suggestion): suggestion is TagSuggestion => Boolean(suggestion));
}

function dateCandidateFromLabel(label: string): DateCandidate | undefined {
  const trimmed = label.trim();
  if (!trimmed) return undefined;
  return {
    label: trimmed,
    precision: inferDatePrecision(trimmed),
    confidence: 0.5,
    sourceText: trimmed
  };
}

function tagSuggestionFromName(name: string, type: TagType): TagSuggestion | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return {
    name: trimmed,
    type,
    confidence: 0.5,
    source: "model"
  };
}

function dateLabelFromLooseCandidate(candidate: Record<string, unknown>): string {
  for (const key of ["date", "year", "time", "name"]) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function inferDatePrecision(label: string): DatePrecision {
  if (/^\d{4}$/.test(label.trim())) return "year";
  if (/^\d{4}-\d{2}$/.test(label.trim())) return "month";
  if (/^\d{4}-\d{2}-\d{2}$/.test(label.trim())) return "day";
  return "unknown";
}

function confidenceOrDefault(value: unknown): number {
  if (value === undefined) return 0.5;
  return typeof value === "number" && value >= 0 && value <= 1 ? value : Number.NaN;
}

function isDatePrecision(value: unknown): value is DatePrecision {
  return (
    value === "exact" ||
    value === "day" ||
    value === "month" ||
    value === "year" ||
    value === "range" ||
    value === "age" ||
    value === "grade" ||
    value === "decade" ||
    value === "unknown"
  );
}

function isTagType(value: unknown): value is TagType {
  return (
    value === "person" ||
    value === "pet" ||
    value === "place" ||
    value === "time" ||
    value === "object" ||
    value === "emotion" ||
    value === "theme" ||
    value === "activity" ||
    value === "life_period" ||
    value === "custom"
  );
}

function isSuggestionSource(value: unknown): value is SuggestionSource {
  return (
    value === "explicit" ||
    value === "imported" ||
    value === "inferred" ||
    value === "known_context" ||
    value === "model" ||
    value === "rule" ||
    value === "user_history"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
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

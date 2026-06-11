import type { DateCandidate, TagSuggestion } from "../core/types";
import type { LifeContext } from "../core/lifeContext";

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

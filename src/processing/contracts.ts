import type { DateCandidate, ProcessingRunRecord, Tag, TagSuggestion, UserProfile } from "../core/types";

export type MemoryProcessingInput = {
  memoryId?: string;
  rawText: string;
  cleanedText?: string;
  userProfile?: UserProfile;
  knownTags?: Tag[];
};

export type MemoryProcessingResult = {
  cleanedText: string;
  dateCandidates: DateCandidate[];
  tagSuggestions: TagSuggestion[];
  processingRuns: ProcessingRunRecord[];
};

export interface ITextCleanupEngine {
  clean(input: string): Promise<string>;
}

export interface IDateExtractionEngine {
  extractDates(input: MemoryProcessingInput): Promise<DateCandidate[]>;
}

export interface ITagSuggestionEngine {
  suggestTags(input: MemoryProcessingInput): Promise<TagSuggestion[]>;
}

export interface IMemoryProcessingPipeline {
  process(input: MemoryProcessingInput): Promise<MemoryProcessingResult>;
}

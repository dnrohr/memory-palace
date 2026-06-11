import type { IMemoryProcessingPipeline, ITextCleanupEngine, IDateExtractionEngine, ITagSuggestionEngine, MemoryProcessingInput, MemoryProcessingResult } from "./contracts";
import { ConservativeTextCleanupEngine } from "./rules/textCleanup";
import { RulesDateExtractionEngine } from "./rules/dateExtraction";
import { RulesTagSuggestionEngine } from "./rules/tagSuggestion";

export class RulesMemoryProcessingPipeline implements IMemoryProcessingPipeline {
  constructor(
    private readonly textCleanup: ITextCleanupEngine = new ConservativeTextCleanupEngine(),
    private readonly dates: IDateExtractionEngine = new RulesDateExtractionEngine(),
    private readonly tags: ITagSuggestionEngine = new RulesTagSuggestionEngine()
  ) {}

  async process(input: MemoryProcessingInput): Promise<MemoryProcessingResult> {
    const cleanedText = input.cleanedText ?? (await this.textCleanup.clean(input.rawText));

    return {
      cleanedText,
      dateCandidates: await this.dates.extractDates(input),
      tagSuggestions: await this.tags.suggestTags(input),
      processingRuns: []
    };
  }
}

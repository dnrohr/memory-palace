import type { ITextCleanupEngine } from "../contracts";

export class ConservativeTextCleanupEngine implements ITextCleanupEngine {
  async clean(input: string): Promise<string> {
    return input
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?;:])/g, "$1")
      .trim();
  }
}

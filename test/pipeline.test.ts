import { describe, expect, it } from "vitest";
import { goldenMemories } from "../src/fixtures/goldenMemories";
import { RulesMemoryProcessingPipeline } from "../src/processing/pipeline";

describe("rules memory processing pipeline", () => {
  it("runs cleanup, date extraction, and tag suggestion", async () => {
    const fixture = goldenMemories[0];
    if (!fixture) throw new Error("Missing golden fixture.");

    const pipeline = new RulesMemoryProcessingPipeline();
    const result = await pipeline.process({
      rawText: `  ${fixture.input}  `,
      ...(fixture.userProfile ? { userProfile: fixture.userProfile } : {})
    });

    expect(result.cleanedText).toBe(fixture.input);
    expect(result.dateCandidates).toContainEqual(
      expect.objectContaining({
        precision: fixture.expectedDate?.precision,
        startDate: fixture.expectedDate?.startDate,
        endDate: fixture.expectedDate?.endDate
      })
    );
    expect(result.tagSuggestions.map((tag) => tag.name)).toContain("Patrick");
  });
});

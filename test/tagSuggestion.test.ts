import { describe, expect, it } from "vitest";
import { goldenMemories } from "../src/fixtures/goldenMemories";
import { suggestTags } from "../src/processing/rules/tagSuggestion";

describe("rules tag suggestion", () => {
  it.each(goldenMemories)("suggests expected tags for $id", (fixture) => {
    const suggestions = suggestTags(fixture.input);
    const suggested = new Map(suggestions.map((tag) => [tag.name, tag]));

    for (const expected of fixture.expectedTags) {
      expect(suggested.get(expected.name)).toEqual(
        expect.objectContaining({
          name: expected.name,
          ...(expected.type ? { type: expected.type } : {})
        })
      );
    }
  });
});

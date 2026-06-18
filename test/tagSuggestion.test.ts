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

  it("suppresses rejected tag names when generating suggestions", () => {
    const suggestions = suggestTags("Maya took the dog to the old house.", { rejectedNames: ["dog", "maya"] });
    const names = suggestions.map((suggestion) => suggestion.name);

    expect(names).not.toContain("dog");
    expect(names).not.toContain("Maya");
    expect(names).toContain("old house");
  });

  it("suggests broader everyday memory themes", () => {
    const names = suggestTags("My sister had surgery after we moved schools before the wedding.").map((suggestion) => suggestion.name);

    expect(names).toEqual(expect.arrayContaining(["family", "health", "moving", "school", "wedding"]));
  });

  it("recognizes explicit hashtags without sentence-start false positives", () => {
    const names = suggestTags("Today I remembered #summer-camp with Patrick.").map((suggestion) => suggestion.name);

    expect(names).toEqual(expect.arrayContaining(["summer camp", "Patrick"]));
    expect(names).not.toContain("Today");
  });
});

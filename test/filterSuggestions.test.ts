import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { buildExploreFilterSuggestionGroups } from "../src/search/filterSuggestions";

const archive: MemoryArchive = {
  exportedAt: "2026-06-19T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "In 2004 I visited Grandma in Queens and walked past the old apartment.",
      title: "Queens walk",
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "2004-01-01",
      datePrecision: "year",
      userDateConfirmed: false
    },
    {
      id: "mem-2",
      rawText: "Quiet mornings in the college library.",
      title: "College library",
      createdAt: "2026-06-18T00:00:00.000Z",
      updatedAt: "2026-06-18T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    },
    {
      id: "mem-3",
      rawText: "A tiny note about antique buttons.",
      title: "Button tin",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    }
  ],
  tags: [
    tag("tag-1", "Grandma", "person"),
    tag("tag-2", "Queens", "place"),
    tag("tag-3", "quiet mornings", "theme"),
    tag("tag-4", "antique buttons", "object")
  ],
  memoryTags: [
    link("mem-1", "tag-1"),
    link("mem-1", "tag-2"),
    link("mem-2", "tag-3"),
    link("mem-3", "tag-4")
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("Explore filter suggestions", () => {
  it("groups case-insensitive tag, person, place, and date suggestions", () => {
    const groups = buildExploreFilterSuggestionGroups({ archive, query: "que" });

    expect(groups.find((group) => group.label === "Places")?.suggestions).toEqual([
      expect.objectContaining({ label: "Queens", type: "place", value: "tag-2", count: 1 })
    ]);
    expect(groups.find((group) => group.label === "People")?.suggestions).toBeUndefined();

    const dateLabels = buildExploreFilterSuggestionGroups({ archive, query: "YEAR" })
      .find((group) => group.label === "Dates")
      ?.suggestions.map((suggestion) => suggestion.label);
    expect(dateLabels).toEqual(["Year-only dates"]);
  });

  it("excludes active filters from suggestions", () => {
    const groups = buildExploreFilterSuggestionGroups({
      archive,
      activeTagIds: ["tag-2"],
      activeDatePrecision: "unknown"
    });

    expect(groups.flatMap((group) => group.suggestions).map((suggestion) => suggestion.value)).not.toContain("tag-2");
    expect(groups.flatMap((group) => group.suggestions).map((suggestion) => suggestion.value)).not.toContain("unknown");
  });

  it("limits each group and ranks prefix matches before substring matches", () => {
    const groups = buildExploreFilterSuggestionGroups({ archive, query: "button", limitPerGroup: 1 });

    expect(groups.find((group) => group.label === "Tags")?.suggestions).toEqual([
      expect.objectContaining({ label: "antique buttons" })
    ]);
  });

  it("can include text snippets without replacing filter suggestions", () => {
    const groups = buildExploreFilterSuggestionGroups({ archive, query: "apartment", includeTextMatches: true });

    expect(groups.find((group) => group.label === "Text")?.suggestions[0]).toEqual(
      expect.objectContaining({
        label: "Queens walk",
        type: "text",
        snippet: expect.stringContaining("apartment")
      })
    );
  });
});

function tag(id: string, name: string, type: MemoryArchive["tags"][number]["type"]): MemoryArchive["tags"][number] {
  return {
    id,
    name,
    normalizedName: name.toLocaleLowerCase(),
    type,
    createdAt: "2026-06-19T00:00:00.000Z",
    updatedAt: "2026-06-19T00:00:00.000Z",
    isUserCreated: true
  };
}

function link(memoryId: string, tagId: string): MemoryArchive["memoryTags"][number] {
  return {
    memoryId,
    tagId,
    source: "explicit",
    userConfirmed: true,
    rejected: false,
    createdAt: "2026-06-19T00:00:00.000Z"
  };
}

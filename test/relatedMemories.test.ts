import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { findRelatedMemories } from "../src/search/relatedMemories";

const now = "2026-06-11T00:00:00.000Z";

const archive: MemoryArchive = {
  exportedAt: now,
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "Patrick the dog slept by the sunny window.",
      title: "Patrick",
      createdAt: now,
      updatedAt: now,
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "1994",
      datePrecision: "year",
      userDateConfirmed: true
    },
    {
      id: "mem-2",
      rawText: "Lila the cat loved the same sunny window.",
      title: "Lila",
      createdAt: now,
      updatedAt: now,
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "1994",
      datePrecision: "year",
      userDateConfirmed: true
    },
    {
      id: "mem-3",
      rawText: "A college library shift after midnight.",
      title: "Library",
      createdAt: now,
      updatedAt: now,
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "2004",
      datePrecision: "year",
      userDateConfirmed: true
    }
  ],
  tags: [
    {
      id: "tag-1",
      name: "pets",
      normalizedName: "pets",
      type: "theme",
      createdAt: now,
      updatedAt: now,
      isUserCreated: true
    }
  ],
  memoryTags: [
    {
      memoryId: "mem-1",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: now
    },
    {
      memoryId: "mem-2",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: now
    }
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("related memories", () => {
  it("scores related memories by shared tags, period, and local semantic similarity", async () => {
    const results = await findRelatedMemories(archive, "mem-1", { includeSemantic: true });

    expect(results[0]?.memory.id).toBe("mem-2");
    expect(results[0]?.sharedTagNames).toEqual(["pets"]);
    expect(results[0]?.reasons).toEqual(expect.arrayContaining(["shared_tag", "same_period", "semantic_similarity"]));
  });

  it("returns no results for missing memories", async () => {
    await expect(findRelatedMemories(archive, "missing")).resolves.toEqual([]);
  });
});

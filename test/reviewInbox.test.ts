import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { buildReviewInbox } from "../src/processing/reviewInbox";

describe("review inbox", () => {
  it("creates review items for unconfirmed metadata", () => {
    const archive: MemoryArchive = {
      exportedAt: "2026-06-11T00:00:00.000Z",
      schemaVersion: "0.1.0",
      memories: [
        {
          id: "mem-1",
          rawText: "In 2004 my dog Patrick slept by the window.",
          title: "Patrick",
          createdAt: "2026-06-11T00:00:00.000Z",
          updatedAt: "2026-06-11T00:00:00.000Z",
          sourceType: "typed",
          isAudioRetained: false,
          datePrecision: "unknown",
          userDateConfirmed: false
        }
      ],
      tags: [],
      memoryTags: [],
      people: [],
      pets: [],
      places: [],
      lifePeriods: [],
      processingRuns: []
    };

    expect(buildReviewInbox(archive)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "untagged_memory", memoryId: "mem-1" }),
        expect.objectContaining({ type: "tag_suggestion", label: "Patrick" }),
        expect.objectContaining({ type: "date_suggestion", label: "2004" })
      ])
    );
  });
});


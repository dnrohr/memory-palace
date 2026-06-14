import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { acceptReviewItem, buildReviewInbox, rejectReviewItem } from "../src/processing/reviewInbox";

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
        expect.objectContaining({
          type: "tag_suggestion",
          label: "Patrick",
          sourceText: "Patrick",
          explanation: expect.stringContaining("Patrick")
        }),
        expect.objectContaining({
          type: "date_suggestion",
          label: "2004",
          sourceText: "2004"
        })
      ])
    );
  });

  it("accepts tag suggestions and date suggestions", () => {
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

    const withTag = acceptReviewItem(archive, {
      id: "mem-1:tag:Patrick",
      memoryId: "mem-1",
      type: "tag_suggestion",
      label: "Patrick",
      confidence: 0.7
    });
    expect(withTag.tags).toEqual([expect.objectContaining({ name: "Patrick" })]);
    expect(withTag.memoryTags).toEqual([expect.objectContaining({ userConfirmed: true, rejected: false })]);

    const withDate = acceptReviewItem(withTag, {
      id: "mem-1:date:2004",
      memoryId: "mem-1",
      type: "date_suggestion",
      label: "2004",
      precision: "year",
      confidence: 0.9,
      startDate: "2004-01-01",
      endDate: "2004-12-31"
    });
    expect(withDate.memories[0]).toEqual(
      expect.objectContaining({
        approximateStartDate: "2004-01-01",
        approximateEndDate: "2004-12-31",
        userDateConfirmed: true
      })
    );
  });

  it("does not accept grade date suggestions without calendar dates", () => {
    const archive: MemoryArchive = {
      exportedAt: "2026-06-11T00:00:00.000Z",
      schemaVersion: "0.1.0",
      memories: [
        {
          id: "mem-1",
          rawText: "When I was in 4th grade, my dog Patrick slept by the window.",
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

    const gradeSuggestion = buildReviewInbox(archive).find((item) => item.type === "date_suggestion" && item.label === "4th grade");

    expect(gradeSuggestion).toEqual(
      expect.objectContaining({
        precision: "grade",
        explanation: expect.stringContaining("need a birth year")
      })
    );
    expect(acceptReviewItem(archive, gradeSuggestion!)).toBe(archive);
  });

  it("rejects tag suggestions and suppresses them from future inboxes", () => {
    const archive: MemoryArchive = {
      exportedAt: "2026-06-11T00:00:00.000Z",
      schemaVersion: "0.1.0",
      memories: [
        {
          id: "mem-1",
          rawText: "Patrick slept by the window.",
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

    const rejected = rejectReviewItem(archive, {
      id: "mem-1:tag:Patrick",
      memoryId: "mem-1",
      type: "tag_suggestion",
      label: "Patrick",
      confidence: 0.7
    });

    expect(rejected.memoryTags).toEqual([expect.objectContaining({ rejected: true })]);
    expect(buildReviewInbox(rejected).some((item) => item.type === "tag_suggestion" && item.label === "Patrick")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import {
  buildLifeChapterCandidates,
  rejectLifeChapterCandidate,
  renameLifeChapterCandidate
} from "../src/visualization/lifeChapters";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "One",
      title: "One",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "2004-01-01",
      datePrecision: "year",
      userDateConfirmed: true
    },
    {
      id: "mem-2",
      rawText: "Two",
      title: "Two",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "2004-05-01",
      datePrecision: "year",
      userDateConfirmed: true
    }
  ],
  tags: [
    {
      id: "tag-1",
      name: "college",
      normalizedName: "college",
      type: "life_period",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
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
      createdAt: "2026-06-11T00:00:00.000Z"
    },
    {
      memoryId: "mem-2",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T00:00:00.000Z"
    }
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [
    {
      id: "period-1",
      name: "college years",
      startDate: "2004-01-01",
      endDate: "2005-12-31",
      datePrecision: "range"
    }
  ],
  processingRuns: []
};

describe("life chapter candidates", () => {
  it("builds editable chapter candidates from timeline, tags, and life periods", () => {
    expect(buildLifeChapterCandidates(archive)).toEqual(
      expect.arrayContaining([
        { id: "timeline:2004", name: "2004", memoryIds: ["mem-1", "mem-2"], basis: "timeline", editable: true },
        { id: "cluster:tag:tag-1", name: "college", memoryIds: ["mem-1", "mem-2"], basis: "tag_cluster", editable: true },
        { id: "period:period-1", name: "college years", memoryIds: ["mem-1", "mem-2"], basis: "life_period", editable: true }
      ])
    );
  });

  it("applies persisted chapter rename and reject decisions", () => {
    const renamed = renameLifeChapterCandidate(archive, "timeline:2004", "College launch", "2026-06-12T00:00:00.000Z");
    const rejected = rejectLifeChapterCandidate(renamed, "cluster:tag:tag-1", "2026-06-12T00:00:00.000Z");
    const chapters = buildLifeChapterCandidates(rejected);

    expect(rejected.lifeChapterDecisions).toEqual([
      {
        candidateId: "cluster:tag:tag-1",
        action: "rejected",
        updatedAt: "2026-06-12T00:00:00.000Z"
      },
      {
        candidateId: "timeline:2004",
        action: "renamed",
        name: "College launch",
        updatedAt: "2026-06-12T00:00:00.000Z"
      }
    ]);
    expect(chapters.map((chapter) => chapter.id)).not.toContain("cluster:tag:tag-1");
    expect(chapters.find((chapter) => chapter.id === "timeline:2004")?.name).toBe("College launch");
  });
});

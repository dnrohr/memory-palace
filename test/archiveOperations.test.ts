import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import {
  buildTimelineBuckets,
  appendMemoryAddendum,
  deleteTag,
  filterTimelineBuckets,
  filterMemories,
  permanentlyDeleteMemory,
  mergeArchive,
  mergeTags,
  previewArchiveMerge,
  renameTag,
  restoreMemory,
  summarizeArchive,
  tagsForMemoryArchive,
  updateTagType
} from "../src/core/archiveOperations";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "Patrick slept in the old house.",
      title: "Patrick",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "1994-01-01",
      datePrecision: "year",
      userDateConfirmed: true
    },
    {
      id: "mem-2",
      rawText: "Maya and I worked late after college.",
      title: "College work",
      createdAt: "2026-06-10T00:00:00.000Z",
      updatedAt: "2026-06-10T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    }
  ],
  tags: [
    {
      id: "tag-1",
      name: "Patrick",
      normalizedName: "patrick",
      type: "pet",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      isUserCreated: true
    },
    {
      id: "tag-2",
      name: "work",
      normalizedName: "work",
      type: "activity",
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
      tagId: "tag-2",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T00:00:00.000Z"
    }
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("archive operations", () => {
  it("filters memories by text, tag, and date precision", () => {
    expect(filterMemories(archive, { text: "old house" }).map((memory) => memory.id)).toEqual(["mem-1"]);
    expect(filterMemories(archive, { tagIds: ["tag-2"] }).map((memory) => memory.id)).toEqual(["mem-2"]);
    expect(filterMemories(archive, { datePrecisions: ["year"] }).map((memory) => memory.id)).toEqual(["mem-1"]);
  });

  it("lists memory tags sorted by name", () => {
    expect(tagsForMemoryArchive(archive, "mem-1").map((tag) => tag.name)).toEqual(["Patrick"]);
  });

  it("renames tags without changing links", () => {
    const next = renameTag(archive, "tag-1", "Patrick dog");

    expect(next.tags.find((tag) => tag.id === "tag-1")).toEqual(
      expect.objectContaining({ name: "Patrick dog", normalizedName: "patrick dog" })
    );
    expect(tagsForMemoryArchive(next, "mem-1").map((tag) => tag.name)).toEqual(["Patrick dog"]);
  });

  it("deletes tags and their memory links", () => {
    const next = deleteTag(archive, "tag-1");

    expect(next.tags.map((tag) => tag.id)).not.toContain("tag-1");
    expect(tagsForMemoryArchive(next, "mem-1")).toEqual([]);
  });

  it("updates tag types", () => {
    const next = updateTagType(archive, "tag-2", "theme");

    expect(next.tags.find((tag) => tag.id === "tag-2")).toEqual(expect.objectContaining({ type: "theme" }));
  });

  it("merges tags and deduplicates links", () => {
    const source: MemoryArchive = {
      ...archive,
      memoryTags: [
        ...archive.memoryTags,
        {
          memoryId: "mem-1",
          tagId: "tag-2",
          source: "explicit",
          userConfirmed: true,
          rejected: false,
          createdAt: "2026-06-11T00:00:00.000Z"
        }
      ]
    };

    const next = mergeTags(source, "tag-2", "tag-1");

    expect(next.tags.map((tag) => tag.id)).toEqual(["tag-1"]);
    expect(next.memoryTags.filter((link) => link.memoryId === "mem-1" && link.tagId === "tag-1")).toHaveLength(1);
    expect(next.memoryTags.find((link) => link.memoryId === "mem-2")).toEqual(expect.objectContaining({ tagId: "tag-1" }));
  });

  it("restores and permanently deletes memories", () => {
    const deleted = {
      ...archive,
      memories: archive.memories.map((memory) => (memory.id === "mem-1" ? { ...memory, deletedAt: "2026-06-12" } : memory))
    };

    expect(restoreMemory(deleted, "mem-1").memories.find((memory) => memory.id === "mem-1")).not.toHaveProperty("deletedAt");

    const purged = permanentlyDeleteMemory(archive, "mem-1");
    expect(purged.memories.map((memory) => memory.id)).toEqual(["mem-2"]);
    expect(purged.memoryTags.map((link) => link.memoryId)).toEqual(["mem-2"]);
  });

  it("appends memory addenda without replacing original text", () => {
    const next = appendMemoryAddendum(archive, "mem-1", "I later remembered the window was blue.", "2026-06-12T00:00:00.000Z");
    const memory = next.memories.find((item) => item.id === "mem-1");

    expect(memory?.rawText).toContain("Patrick slept in the old house.");
    expect(memory?.rawText).toContain("Addendum (2026-06-12): I later remembered the window was blue.");
    expect(memory?.updatedAt).toBe("2026-06-12T00:00:00.000Z");
  });

  it("builds timeline buckets from approximate or created dates", () => {
    const buckets = buildTimelineBuckets(archive.memories);

    expect(buckets.map((bucket) => bucket.key)).toEqual(["2026", "1994"]);
    expect(buckets.find((bucket) => bucket.key === "1994")?.memories.map((memory) => memory.id)).toEqual(["mem-1"]);
    expect(buckets.find((bucket) => bucket.key === "1994")?.entries[0]).toEqual(
      expect.objectContaining({
        dateLabel: "1994-01-01",
        certainty: "confirmed",
        span: "point"
      })
    );
    expect(buckets.find((bucket) => bucket.key === "2026")?.entries[0]).toEqual(
      expect.objectContaining({
        certainty: "unknown",
        span: "unknown"
      })
    );
  });

  it("filters timeline buckets by certainty, span, and year range", () => {
    const memories = [
      ...archive.memories,
      {
        id: "mem-3",
        rawText: "A range memory.",
        title: "Range",
        createdAt: "2026-06-11T00:00:00.000Z",
        updatedAt: "2026-06-11T00:00:00.000Z",
        sourceType: "typed" as const,
        isAudioRetained: false,
        approximateStartDate: "2001-01-01",
        approximateEndDate: "2002-01-01",
        datePrecision: "year" as const,
        userDateConfirmed: false
      }
    ];
    const buckets = buildTimelineBuckets(memories);

    expect(filterTimelineBuckets(buckets, { certainties: ["confirmed"] }).flatMap((bucket) => bucket.memories.map((memory) => memory.id))).toEqual([
      "mem-1"
    ]);
    expect(filterTimelineBuckets(buckets, { spans: ["range"] }).flatMap((bucket) => bucket.memories.map((memory) => memory.id))).toEqual([
      "mem-3"
    ]);
    expect(filterTimelineBuckets(buckets, { fromYear: 2000, toYear: 2020 }).flatMap((bucket) => bucket.memories.map((memory) => memory.id))).toEqual([
      "mem-3"
    ]);
  });

  it("summarizes archive audit data", () => {
    expect(summarizeArchive(archive)).toEqual(
      expect.objectContaining({
        activeMemoryCount: 2,
        deletedMemoryCount: 0,
        tagCount: 2,
        retainedAudioCount: 0,
        confirmedDateCount: 1,
        inferredDateCount: 0,
        processingRunCount: 0
      })
    );
  });

  it("previews and merges imported archives without duplicating existing memories", () => {
    const incoming: MemoryArchive = {
      ...archive,
      memories: [
        archive.memories[0]!,
        {
          id: "mem-3",
          rawText: "A new imported memory.",
          title: "Imported",
          createdAt: "2026-06-12T00:00:00.000Z",
          updatedAt: "2026-06-12T00:00:00.000Z",
          sourceType: "import",
          isAudioRetained: false,
          datePrecision: "unknown",
          userDateConfirmed: false
        }
      ],
      tags: [
        archive.tags[0]!,
        {
          id: "tag-3",
          name: "imported",
          normalizedName: "imported",
          type: "custom",
          createdAt: "2026-06-12T00:00:00.000Z",
          updatedAt: "2026-06-12T00:00:00.000Z",
          isUserCreated: false
        }
      ],
      memoryTags: [
        {
          memoryId: "mem-3",
          tagId: "tag-3",
          source: "imported",
          userConfirmed: true,
          rejected: false,
          createdAt: "2026-06-12T00:00:00.000Z"
        }
      ]
    };

    expect(previewArchiveMerge(archive, incoming)).toEqual(
      expect.objectContaining({
        incomingMemoryCount: 2,
        newMemoryCount: 1,
        duplicateMemoryCount: 1,
        newTagCount: 1
      })
    );

    const merged = mergeArchive(archive, incoming);
    expect(merged.memories.map((memory) => memory.id)).toContain("mem-3");
    expect(merged.memories.filter((memory) => memory.rawText === archive.memories[0]?.rawText)).toHaveLength(1);
    expect(merged.tags.map((tag) => tag.normalizedName)).toContain("imported");
  });

  it("applies selected merge resolutions for import conflicts", () => {
    const incoming: MemoryArchive = {
      ...archive,
      memories: [
        { ...archive.memories[0]!, id: "mem-copy" },
        {
          ...archive.memories[0]!,
          rawText: "Replacement text.",
          title: "Replacement",
          updatedAt: "2026-06-12T00:00:00.000Z"
        }
      ],
      tags: [{ ...archive.tags[0]!, id: "tag-copy", type: "theme" }],
      memoryTags: [
        {
          memoryId: "mem-copy",
          tagId: "tag-copy",
          source: "imported",
          userConfirmed: true,
          rejected: false,
          createdAt: "2026-06-12T00:00:00.000Z"
        }
      ]
    };

    const replaced = mergeArchive(archive, incoming, {
      duplicateMemory: "skip",
      memoryIdConflict: "replace",
      tagTypeConflict: "use_incoming"
    });
    expect(replaced.memories.find((memory) => memory.id === "mem-1")?.rawText).toBe("Replacement text.");
    expect(replaced.memories.some((memory) => memory.id === "mem-copy")).toBe(false);
    expect(replaced.tags.find((tag) => tag.normalizedName === "patrick")?.type).toBe("theme");

    const keptBoth = mergeArchive(archive, incoming, {
      duplicateMemory: "import_copy",
      memoryIdConflict: "keep_both"
    });
    expect(keptBoth.memories.map((memory) => memory.id)).toEqual(expect.arrayContaining(["mem-copy", "mem-1-imported", "mem-1"]));
  });
});

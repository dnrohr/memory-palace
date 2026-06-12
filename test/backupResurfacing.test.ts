import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { BackupExportProvider } from "../src/export/backup";
import { buildResurfacingPrompts } from "../src/product/resurfacing";

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
    }
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("backup and resurfacing", () => {
  it("creates a backup manifest with JSON and Markdown artifacts", async () => {
    const artifacts = await new BackupExportProvider().exportBackup(archive, "2026-06-11T00:00:00.000Z");

    expect(artifacts.map((artifact) => artifact.fileName)).toEqual([
      "backup-manifest.json",
      "memory-palace-export.json",
      "memories/2026/patrick.md"
    ]);
    expect(JSON.parse(artifacts[0]?.content ?? "{}")).toEqual(
      expect.objectContaining({ artifactCount: 2, memoryCount: 1, tagCount: 1 })
    );
  });

  it("builds gentle resurfacing prompts", () => {
    expect(buildResurfacingPrompts(archive)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "random_memory", memoryId: "mem-1" }),
        expect.objectContaining({ kind: "tag_prompt", tagId: "tag-1" })
      ])
    );
  });

  it("skips sensitive or excluded memories while resurfacing", () => {
    const hidden: MemoryArchive = {
      ...archive,
      memories: archive.memories.map((memory) => ({
        ...memory,
        isSensitive: true,
        excludeFromResurfacing: true
      }))
    };

    expect(buildResurfacingPrompts(hidden)).toEqual([]);
  });
});

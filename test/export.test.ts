import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { JsonExportProvider } from "../src/export/jsonExport";
import { MarkdownExportProvider } from "../src/export/markdownExport";
import { SqliteExportProvider } from "../src/export/sqliteExport";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T12:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "My dog Patrick loved the old house.",
      cleanedText: "My dog Patrick loved the old house.",
      title: "Patrick at the old house",
      createdAt: "2026-06-11T12:00:00.000Z",
      updatedAt: "2026-06-11T12:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "1994-08-01",
      approximateEndDate: "1995-06-30",
      datePrecision: "grade",
      userDateConfirmed: false
    }
  ],
  tags: [
    {
      id: "tag-1",
      name: "Patrick",
      normalizedName: "patrick",
      type: "pet",
      createdAt: "2026-06-11T12:00:00.000Z",
      updatedAt: "2026-06-11T12:00:00.000Z",
      isUserCreated: false
    },
    {
      id: "tag-2",
      name: "old house",
      normalizedName: "old house",
      type: "place",
      createdAt: "2026-06-11T12:00:00.000Z",
      updatedAt: "2026-06-11T12:00:00.000Z",
      isUserCreated: false
    }
  ],
  memoryTags: [
    {
      memoryId: "mem-1",
      tagId: "tag-1",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T12:00:00.000Z"
    },
    {
      memoryId: "mem-1",
      tagId: "tag-2",
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: "2026-06-11T12:00:00.000Z"
    }
  ],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("export providers", () => {
  it("exports the full archive as pretty JSON", async () => {
    const [artifact] = await new JsonExportProvider().exportArchive(archive);

    expect(artifact).toEqual(
      expect.objectContaining({
        fileName: "memory-palace-export.json",
        mediaType: "application/json"
      })
    );
    expect(JSON.parse(artifact?.content ?? "")).toEqual(archive);
  });

  it("exports active memories as markdown files with front matter", async () => {
    const [artifact] = await new MarkdownExportProvider().exportArchive(archive);

    expect(artifact?.fileName).toBe("memories/1994/patrick-at-the-old-house.md");
    expect(artifact?.content).toContain('id: "mem-1"');
    expect(artifact?.content).toContain('  - "Patrick"');
    expect(artifact?.content).toContain('  - "old house"');
    expect(artifact?.content).toContain("My dog Patrick loved the old house.");
  });

  it("exports a portable SQLite SQL dump", async () => {
    const [artifact] = await new SqliteExportProvider().exportArchive({
      ...archive,
      memories: [{ ...archive.memories[0]!, title: "Patrick's old house" }]
    });

    expect(artifact).toEqual(
      expect.objectContaining({
        fileName: "memory-palace-export.sql",
        mediaType: "application/sql"
      })
    );
    expect(artifact?.content).toContain("CREATE TABLE IF NOT EXISTS memory");
    expect(artifact?.content).toContain("'Patrick''s old house'");
    expect(artifact?.content).toContain("INSERT INTO memory_fts(memory_fts) VALUES ('rebuild');");
  });
});

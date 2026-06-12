import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { MarkdownBundleExportProvider } from "../src/export/markdownBundle";
import { MarkdownExportProvider } from "../src/export/markdownExport";
import { JsonImportProvider } from "../src/import/jsonImport";
import { MarkdownImportProvider } from "../src/import/markdownImport";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "Patrick slept in the old house.",
      cleanedText: "Patrick slept in the old house.",
      title: "Patrick at the old house",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      approximateStartDate: "1994-01-01",
      datePrecision: "year",
      userDateConfirmed: true
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

describe("import providers", () => {
  it("previews JSON archives", async () => {
    const preview = await new JsonImportProvider().previewImport([
      { fileName: "memory-palace-export.json", content: JSON.stringify(archive) }
    ]);

    expect(preview.memoryCount).toBe(1);
    expect(preview.tagCount).toBe(1);
    expect(preview.warnings).toEqual([]);
  });

  it("imports Markdown exported by the Markdown provider", async () => {
    const [artifact] = await new MarkdownExportProvider().exportArchive(archive);
    if (!artifact) throw new Error("Missing markdown artifact.");

    const preview = await new MarkdownImportProvider().previewImport([artifact]);

    expect(preview.memoryCount).toBe(1);
    expect(preview.tagCount).toBe(1);
    expect(preview.archive.memories[0]).toEqual(
      expect.objectContaining({
        id: "mem-1",
        title: "Patrick at the old house",
        rawText: "Patrick slept in the old house."
      })
    );
    expect(preview.archive.tags[0]).toEqual(expect.objectContaining({ name: "Patrick" }));
  });

  it("imports folder-style Markdown bundles without manifest warnings", async () => {
    const artifacts = await new MarkdownBundleExportProvider().exportArchive(archive, "2026-06-12T00:00:00.000Z");
    const preview = await new MarkdownImportProvider().previewImport(artifacts);

    expect(preview.memoryCount).toBe(1);
    expect(preview.tagCount).toBe(1);
    expect(preview.warnings).toEqual([]);
    expect(preview.archive.memories[0]).toEqual(expect.objectContaining({ id: "mem-1" }));
  });
});

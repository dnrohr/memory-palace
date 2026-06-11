import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { applyArchiveImport, previewArchiveImport } from "../src/import/importWorkflow";

const emptyArchive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [],
  tags: [],
  memoryTags: [],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  processingRuns: []
};

describe("import workflow", () => {
  it("previews and applies JSON imports", async () => {
    const incoming: MemoryArchive = {
      ...emptyArchive,
      memories: [
        {
          id: "mem-1",
          rawText: "Imported memory.",
          createdAt: "2026-06-11T00:00:00.000Z",
          updatedAt: "2026-06-11T00:00:00.000Z",
          sourceType: "import",
          isAudioRetained: false,
          datePrecision: "unknown",
          userDateConfirmed: false
        }
      ]
    };

    const preview = await previewArchiveImport(emptyArchive, [
      { fileName: "memory-palace-export.json", content: JSON.stringify(incoming) }
    ]);

    expect(preview.mergePreview).toEqual(expect.objectContaining({ newMemoryCount: 1 }));
    expect(applyArchiveImport(emptyArchive, preview).memories).toHaveLength(1);
  });

  it("previews Markdown imports", async () => {
    const preview = await previewArchiveImport(emptyArchive, [
      {
        fileName: "memories/unknown/imported.md",
        content: `---\nid: "mem-1"\ntitle: "Imported"\ntags:\n  - "tagged"\n---\n\nImported memory.\n`
      }
    ]);

    expect(preview.memoryCount).toBe(1);
    expect(preview.tagCount).toBe(1);
    expect(preview.mergePreview.newMemoryCount).toBe(1);
  });
});


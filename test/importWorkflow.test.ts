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

  it("previews duplicate and type conflicts before import", async () => {
    const current: MemoryArchive = {
      ...emptyArchive,
      memories: [
        {
          id: "mem-1",
          rawText: "Same text.",
          title: "Original",
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
          name: "home",
          normalizedName: "home",
          type: "place",
          createdAt: "2026-06-11T00:00:00.000Z",
          updatedAt: "2026-06-11T00:00:00.000Z",
          isUserCreated: true
        }
      ]
    };
    const incoming: MemoryArchive = {
      ...emptyArchive,
      memories: [
        { ...current.memories[0]!, id: "mem-import" },
        {
          ...current.memories[0]!,
          rawText: "Different text.",
          title: "Incoming",
          updatedAt: "2026-06-12T00:00:00.000Z"
        }
      ],
      tags: [{ ...current.tags[0]!, id: "tag-2", type: "theme" }]
    };

    const preview = await previewArchiveImport(current, [{ fileName: "memory-palace-export.json", content: JSON.stringify(incoming) }]);

    expect(preview.mergePreview.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "duplicate_memory", incomingId: "mem-import", existingId: "mem-1" }),
        expect.objectContaining({ kind: "memory_id_conflict", memoryId: "mem-1" }),
        expect.objectContaining({ kind: "tag_type_conflict", tagName: "home", existingType: "place", incomingType: "theme" })
      ])
    );
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

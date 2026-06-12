import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { buildDataAuditReport, clearProcessingRuns, clearRetainedAudioReferences } from "../src/security/dataAudit";

const now = "2026-06-11T00:00:00.000Z";

const archive: MemoryArchive = {
  exportedAt: now,
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "Audio memory",
      title: "Audio",
      createdAt: now,
      updatedAt: now,
      sourceType: "voice",
      audioUri: "file:///audio.m4a",
      isAudioRetained: true,
      datePrecision: "unknown",
      userDateConfirmed: false
    },
    {
      id: "mem-2",
      rawText: "Deleted memory",
      title: "Deleted",
      createdAt: now,
      updatedAt: now,
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false,
      deletedAt: now
    }
  ],
  tags: [],
  memoryTags: [],
  people: [],
  pets: [],
  places: [],
  lifePeriods: [],
  memoryEmbeddings: [
    {
      memoryId: "mem-1",
      values: [0.1, 0.2, 0.3],
      dimension: 3,
      modelId: "hash-embedding",
      modelVersion: "0.1.0",
      inputHash: "abc",
      createdAt: now
    }
  ],
  processingRuns: [
    {
      processorName: "rules",
      processorVersion: "0.1.0",
      inputHash: "abc",
      outputJson: "{}",
      createdAt: now
    }
  ]
};

describe("data audit", () => {
  it("summarizes local data categories", () => {
    expect(buildDataAuditReport(archive)).toEqual(
      expect.objectContaining({
        activeMemoryCount: 1,
        deletedMemoryCount: 1,
        retainedAudioCount: 1,
        embeddingCount: 1,
        processingRunCount: 1,
        estimatedTextBytes: 40,
        estimatedEmbeddingBytes: 24,
        estimatedProcessingBytes: 2,
        estimatedTotalLocalBytes: 66
      })
    );
  });

  it("clears processing runs", () => {
    expect(clearProcessingRuns(archive).processingRuns).toEqual([]);
  });

  it("clears retained audio references without deleting memory text", () => {
    const next = clearRetainedAudioReferences(archive, "2026-06-12T00:00:00.000Z");
    const memory = next.memories.find((item) => item.id === "mem-1");

    expect(memory).toEqual(
      expect.objectContaining({
        rawText: "Audio memory",
        isAudioRetained: false,
        updatedAt: "2026-06-12T00:00:00.000Z"
      })
    );
    expect(memory).not.toHaveProperty("audioUri");
  });
});

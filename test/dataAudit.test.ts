import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import {
  buildDataAuditReport,
  clearDeletedMemoryArtifacts,
  clearProcessingRuns,
  clearRetainedAudioReferences
} from "../src/security/dataAudit";

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
      audioUri: "file:///deleted.m4a",
      isAudioRetained: true,
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
    },
    {
      memoryId: "mem-2",
      values: [0.4, 0.5],
      dimension: 2,
      modelId: "hash-embedding",
      modelVersion: "0.1.0",
      inputHash: "deleted",
      createdAt: now
    },
    {
      memoryId: "mem-missing",
      values: [0.6],
      dimension: 1,
      modelId: "hash-embedding",
      modelVersion: "0.1.0",
      inputHash: "missing",
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
        retainedAudioCount: 2,
        deletedRetainedAudioCount: 1,
        embeddingCount: 3,
        staleEmbeddingCount: 2,
        processingRunCount: 1,
        estimatedTextBytes: 40,
        estimatedEmbeddingBytes: 48,
        estimatedProcessingBytes: 2,
        estimatedTotalLocalBytes: 90
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

  it("clears deleted-memory audio references and stale embeddings", () => {
    const next = clearDeletedMemoryArtifacts(archive, "2026-06-12T00:00:00.000Z");
    const deleted = next.memories.find((item) => item.id === "mem-2");

    expect(deleted).toEqual(
      expect.objectContaining({
        rawText: "Deleted memory",
        isAudioRetained: false,
        updatedAt: "2026-06-12T00:00:00.000Z"
      })
    );
    expect(deleted).not.toHaveProperty("audioUri");
    expect(next.memoryEmbeddings?.map((embedding) => embedding.memoryId)).toEqual(["mem-1"]);
  });
});

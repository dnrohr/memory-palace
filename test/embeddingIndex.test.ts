import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { HashEmbeddingEngine } from "../src/processing/embeddings";
import { findStaleEmbeddingMemoryIds, rebuildEmbeddingIndex, searchEmbeddingIndex } from "../src/search/embeddingIndex";

const now = "2026-06-11T00:00:00.000Z";

function archiveFixture(): MemoryArchive {
  return {
    exportedAt: now,
    schemaVersion: "0.1.0",
    memories: [
      {
        id: "mem-1",
        rawText: "Patrick the dog slept by the window.",
        title: "Patrick",
        createdAt: now,
        updatedAt: now,
        sourceType: "typed",
        isAudioRetained: false,
        datePrecision: "unknown",
        userDateConfirmed: false
      },
      {
        id: "mem-2",
        rawText: "Maya and I studied in the college library.",
        title: "College library",
        createdAt: now,
        updatedAt: now,
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
    memoryEmbeddings: [],
    processingRuns: []
  };
}

describe("embedding index", () => {
  it("detects stale memories and rebuilds stored embeddings", async () => {
    const engine = new HashEmbeddingEngine(128);
    const initial = archiveFixture();

    expect(findStaleEmbeddingMemoryIds(initial, engine)).toEqual(["mem-1", "mem-2"]);

    const result = await rebuildEmbeddingIndex(initial, { engine, now });

    expect(result.indexedMemoryIds).toEqual(["mem-1", "mem-2"]);
    expect(result.archive.memoryEmbeddings).toHaveLength(2);
    expect(findStaleEmbeddingMemoryIds(result.archive, engine)).toEqual([]);
  });

  it("searches the stored vector index", async () => {
    const engine = new HashEmbeddingEngine(256);
    const { archive } = await rebuildEmbeddingIndex(archiveFixture(), { engine, now });
    const results = await searchEmbeddingIndex(archive, "dog window", { engine });

    expect(results[0]?.memory.id).toBe("mem-1");
  });

  it("removes embeddings for deleted memories", async () => {
    const engine = new HashEmbeddingEngine(64);
    const { archive } = await rebuildEmbeddingIndex(archiveFixture(), { engine, now });
    const deletedArchive = {
      ...archive,
      memories: archive.memories.map((memory) => (memory.id === "mem-1" ? { ...memory, deletedAt: now } : memory))
    };
    const result = await rebuildEmbeddingIndex(deletedArchive, { engine, now });

    expect(result.removedMemoryIds).toContain("mem-1");
    expect(result.archive.memoryEmbeddings?.map((embedding) => embedding.memoryId)).toEqual(["mem-2"]);
  });
});

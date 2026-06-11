import { describe, expect, it } from "vitest";
import type { MemoryArchive } from "../src/core/archive";
import { HashEmbeddingEngine } from "../src/processing/embeddings";
import { cosineSimilarity, semanticSearchArchive } from "../src/search/semanticSearch";

const archive: MemoryArchive = {
  exportedAt: "2026-06-11T00:00:00.000Z",
  schemaVersion: "0.1.0",
  memories: [
    {
      id: "mem-1",
      rawText: "My dog Patrick slept by the sunny window.",
      title: "Patrick",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
      sourceType: "typed",
      isAudioRetained: false,
      datePrecision: "unknown",
      userDateConfirmed: false
    },
    {
      id: "mem-2",
      rawText: "Maya and I worked late after college.",
      title: "Work",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
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
  processingRuns: []
};

describe("semantic search", () => {
  it("creates deterministic local hash embeddings", async () => {
    const engine = new HashEmbeddingEngine(8);

    await expect(engine.embedText("dog dog cat")).resolves.toEqual(
      expect.objectContaining({
        modelId: "hash-embedding",
        values: expect.any(Array)
      })
    );
  });

  it("searches memories by vector similarity", async () => {
    const results = await semanticSearchArchive(archive, "dog window", new HashEmbeddingEngine(256));

    expect(results[0]?.memory.id).toBe("mem-1");
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});

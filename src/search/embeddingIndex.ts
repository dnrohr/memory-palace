import type { MemoryArchive } from "../core/archive";
import type { Memory, MemoryEmbeddingRecord } from "../core/types";
import { embedSearchQuery, HashEmbeddingEngine, type IEmbeddingEngine } from "../processing/embeddings";
import { cosineSimilarity, type SemanticSearchResult } from "./semanticSearch";

export type EmbeddingIndexResult = {
  archive: MemoryArchive;
  indexedMemoryIds: string[];
  removedMemoryIds: string[];
};

export type EmbeddingIndexOptions = {
  engine?: IEmbeddingEngine;
  now?: string;
};

export function findStaleEmbeddingMemoryIds(
  archive: MemoryArchive,
  engine: IEmbeddingEngine = new HashEmbeddingEngine()
): string[] {
  const embeddings = new Map((archive.memoryEmbeddings ?? []).map((embedding) => [embedding.memoryId, embedding]));

  return activeMemories(archive)
    .filter((memory) => {
      const embedding = embeddings.get(memory.id);
      if (!embedding) return true;
      return (
        embedding.modelId !== engine.id ||
        embedding.dimension !== engine.dimension ||
        embedding.inputHash !== memoryEmbeddingInputHash(memory)
      );
    })
    .map((memory) => memory.id);
}

export async function rebuildEmbeddingIndex(
  archive: MemoryArchive,
  options: EmbeddingIndexOptions = {}
): Promise<EmbeddingIndexResult> {
  const engine = options.engine ?? new HashEmbeddingEngine();
  const now = options.now ?? new Date().toISOString();
  const activeMemoryIds = new Set(activeMemories(archive).map((memory) => memory.id));
  const staleMemoryIds = new Set(findStaleEmbeddingMemoryIds(archive, engine));
  const retainedEmbeddings = (archive.memoryEmbeddings ?? []).filter((embedding) => {
    return activeMemoryIds.has(embedding.memoryId) && !staleMemoryIds.has(embedding.memoryId);
  });
  const removedMemoryIds = (archive.memoryEmbeddings ?? [])
    .filter((embedding) => !activeMemoryIds.has(embedding.memoryId) || staleMemoryIds.has(embedding.memoryId))
    .map((embedding) => embedding.memoryId);
  const nextEmbeddings: MemoryEmbeddingRecord[] = [...retainedEmbeddings];
  const memoriesById = new Map(activeMemories(archive).map((memory) => [memory.id, memory]));
  const indexedMemoryIds: string[] = [];

  for (const memoryId of staleMemoryIds) {
    const memory = memoriesById.get(memoryId);
    if (!memory) continue;
    const vector = await engine.embedText(memoryEmbeddingText(memory));
    if (!vector) continue;
    nextEmbeddings.push({
      memoryId,
      values: vector.values,
      dimension: vector.values.length,
      modelId: vector.modelId,
      modelVersion: vector.modelVersion,
      inputHash: memoryEmbeddingInputHash(memory),
      createdAt: now
    });
    indexedMemoryIds.push(memoryId);
  }

  return {
    archive: {
      ...archive,
      memoryEmbeddings: nextEmbeddings.sort((a, b) => a.memoryId.localeCompare(b.memoryId))
    },
    indexedMemoryIds,
    removedMemoryIds
  };
}

export async function searchEmbeddingIndex(
  archive: MemoryArchive,
  query: string,
  options: { engine?: IEmbeddingEngine; limit?: number } = {}
): Promise<SemanticSearchResult[]> {
  const engine = options.engine ?? new HashEmbeddingEngine();
  const queryEmbedding = await embedSearchQuery(engine, query);
  if (!queryEmbedding) return [];

  const memoriesById = new Map(activeMemories(archive).map((memory) => [memory.id, memory]));
  const limit = options.limit ?? 10;

  return (archive.memoryEmbeddings ?? [])
    .filter((embedding) => embedding.modelId === engine.id && embedding.dimension === engine.dimension)
    .map((embedding) => {
      const memory = memoriesById.get(embedding.memoryId);
      if (!memory) return undefined;
      return {
        memory,
        score: cosineSimilarity(queryEmbedding.values, embedding.values)
      };
    })
    .filter((result): result is SemanticSearchResult => Boolean(result))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function activeMemories(archive: MemoryArchive): Memory[] {
  return archive.memories.filter((memory) => !memory.deletedAt);
}

function memoryEmbeddingText(memory: Memory): string {
  return [memory.title, memory.summary, memory.cleanedText ?? memory.rawText].filter(Boolean).join(" ");
}

function memoryEmbeddingInputHash(memory: Memory): string {
  return positiveHash(
    [
      memory.id,
      memory.title ?? "",
      memory.summary ?? "",
      memory.cleanedText ?? "",
      memory.rawText,
      memory.updatedAt,
      memory.deletedAt ?? ""
    ].join("\n")
  ).toString(16);
}

function positiveHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

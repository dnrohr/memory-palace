import type { MemoryArchive } from "../core/archive";
import type { Memory } from "../core/types";
import { HashEmbeddingEngine, type IEmbeddingEngine } from "../processing/embeddings";

export type SemanticSearchResult = {
  memory: Memory;
  score: number;
};

export async function semanticSearchArchive(
  archive: MemoryArchive,
  query: string,
  engine: IEmbeddingEngine = new HashEmbeddingEngine(),
  limit = 10
): Promise<SemanticSearchResult[]> {
  const queryEmbedding = await engine.embedText(query);
  if (!queryEmbedding) return [];

  const results: SemanticSearchResult[] = [];

  for (const memory of archive.memories.filter((item) => !item.deletedAt)) {
    const memoryEmbedding = await engine.embedText([memory.title, memory.cleanedText ?? memory.rawText].filter(Boolean).join(" "));
    if (!memoryEmbedding) continue;
    results.push({
      memory,
      score: cosineSimilarity(queryEmbedding.values, memoryEmbedding.values)
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    dot += left * right;
    magnitudeA += left * left;
    magnitudeB += right * right;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}


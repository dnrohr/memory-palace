import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";
import type { Memory } from "../core/types";
import { HashEmbeddingEngine, type IEmbeddingEngine } from "../processing/embeddings";
import { cosineSimilarity } from "./semanticSearch";

export type RelatedMemoryReason = "shared_tag" | "same_period" | "semantic_similarity";

export type RelatedMemoryResult = {
  memory: Memory;
  score: number;
  reasons: RelatedMemoryReason[];
  sharedTagNames: string[];
};

export type RelatedMemoryOptions = {
  limit?: number;
  embeddingEngine?: IEmbeddingEngine;
  includeSemantic?: boolean;
};

export async function findRelatedMemories(
  archive: MemoryArchive,
  memoryId: string,
  options: RelatedMemoryOptions = {}
): Promise<RelatedMemoryResult[]> {
  const source = archive.memories.find((memory) => memory.id === memoryId && !memory.deletedAt);
  if (!source) return [];

  const limit = options.limit ?? 5;
  const includeSemantic = options.includeSemantic ?? true;
  const embeddingEngine = options.embeddingEngine ?? new HashEmbeddingEngine();
  const sourceTagNames = tagsForMemoryArchive(archive, source.id).map((tag) => tag.name);
  const sourceTagNameSet = new Set(sourceTagNames.map(normalize));
  const sourcePeriod = memoryPeriod(source);
  const sourceEmbedding = includeSemantic ? await embeddingEngine.embedText(memoryEmbeddingText(source)) : undefined;
  const results: RelatedMemoryResult[] = [];

  for (const candidate of archive.memories.filter((memory) => memory.id !== source.id && !memory.deletedAt)) {
    const candidateTags = tagsForMemoryArchive(archive, candidate.id);
    const sharedTagNames = candidateTags.map((tag) => tag.name).filter((name) => sourceTagNameSet.has(normalize(name)));
    const reasons = new Set<RelatedMemoryReason>();
    let score = sharedTagNames.length * 3;

    if (sharedTagNames.length > 0) reasons.add("shared_tag");

    if (sourcePeriod && sourcePeriod === memoryPeriod(candidate)) {
      reasons.add("same_period");
      score += 1;
    }

    if (sourceEmbedding) {
      const candidateEmbedding = await embeddingEngine.embedText(memoryEmbeddingText(candidate));
      if (candidateEmbedding) {
        const semanticScore = cosineSimilarity(sourceEmbedding.values, candidateEmbedding.values);
        if (semanticScore > 0) {
          reasons.add("semantic_similarity");
          score += semanticScore * 2;
        }
      }
    }

    if (score <= 0) continue;
    results.push({
      memory: candidate,
      score,
      reasons: [...reasons],
      sharedTagNames
    });
  }

  return results.sort(compareRelatedResults).slice(0, limit);
}

function compareRelatedResults(a: RelatedMemoryResult, b: RelatedMemoryResult): number {
  return b.score - a.score || b.sharedTagNames.length - a.sharedTagNames.length || b.memory.updatedAt.localeCompare(a.memory.updatedAt);
}

function memoryEmbeddingText(memory: Memory): string {
  return [memory.title, memory.summary, memory.cleanedText ?? memory.rawText].filter(Boolean).join(" ");
}

function memoryPeriod(memory: Memory): string | undefined {
  if (memory.approximateStartDate) return memory.approximateStartDate.slice(0, 4);
  if (memory.capturedAt) return memory.capturedAt.slice(0, 4);
  return undefined;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

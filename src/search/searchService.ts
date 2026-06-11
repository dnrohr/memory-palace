import type { MemoryArchive } from "../core/archive";
import { filterMemories, tagsForMemoryArchive, type MemoryFilter } from "../core/archiveOperations";
import type { Memory } from "../core/types";

export type SearchResult = {
  memory: Memory;
  score: number;
  snippet: string;
  matchedTags: string[];
};

export function searchArchive(archive: MemoryArchive, filter: MemoryFilter = {}): SearchResult[] {
  const query = normalize(filter.text ?? "");
  return filterMemories(archive, filter)
    .map((memory) => {
      const tags = tagsForMemoryArchive(archive, memory.id);
      const matchedTags = query ? tags.filter((tag) => normalize(tag.name).includes(query)).map((tag) => tag.name) : [];
      return {
        memory,
        score: scoreMemory(memory, tags.map((tag) => tag.name), query),
        snippet: buildSnippet(memory, query),
        matchedTags
      };
    })
    .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt));
}

function scoreMemory(memory: Memory, tags: string[], query: string): number {
  if (!query) return 1;

  let score = 0;
  if (normalize(memory.title ?? "").includes(query)) score += 10;
  if (normalize(memory.cleanedText ?? memory.rawText).includes(query)) score += 5;
  if (tags.some((tag) => normalize(tag).includes(query))) score += 7;
  if (memory.approximateStartDate?.includes(query)) score += 3;
  return score;
}

function buildSnippet(memory: Memory, query: string): string {
  const text = memory.cleanedText || memory.rawText;
  if (!query) return truncate(text, 140);

  const index = normalize(text).indexOf(query);
  if (index < 0) return truncate(text, 140);

  const start = Math.max(0, index - 48);
  const end = Math.min(text.length, index + query.length + 92);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}


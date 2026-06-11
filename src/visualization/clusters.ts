import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";
import type { Memory } from "../core/types";

export type MemoryCluster = {
  id: string;
  label: string;
  memoryIds: string[];
  basis: "shared_tag";
};

export function buildTagClusters(archive: MemoryArchive, minimumMemories = 2): MemoryCluster[] {
  const memoriesByTag = new Map<string, { label: string; memories: Memory[] }>();

  for (const memory of archive.memories.filter((item) => !item.deletedAt)) {
    for (const tag of tagsForMemoryArchive(archive, memory.id)) {
      const existing = memoriesByTag.get(tag.id) ?? { label: tag.name, memories: [] };
      existing.memories.push(memory);
      memoriesByTag.set(tag.id, existing);
    }
  }

  return [...memoriesByTag.entries()]
    .filter(([, group]) => group.memories.length >= minimumMemories)
    .map(([tagId, group]) => ({
      id: `tag:${tagId}`,
      label: group.label,
      memoryIds: group.memories.map((memory) => memory.id),
      basis: "shared_tag" as const
    }))
    .sort((a, b) => b.memoryIds.length - a.memoryIds.length || a.label.localeCompare(b.label));
}


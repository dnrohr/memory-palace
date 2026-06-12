import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";

export type ResurfacingPrompt = {
  id: string;
  label: string;
  memoryId?: string;
  tagId?: string;
  kind: "random_memory" | "tag_prompt" | "unfinished_memory";
};

export function buildResurfacingPrompts(archive: MemoryArchive): ResurfacingPrompt[] {
  const activeMemories = archive.memories.filter((memory) => !memory.deletedAt);
  const resurfacingMemories = activeMemories.filter((memory) => !memory.isSensitive && !memory.excludeFromResurfacing);
  const prompts: ResurfacingPrompt[] = [];
  const firstMemory = resurfacingMemories[0];

  if (firstMemory) {
    prompts.push({
      id: `random:${firstMemory.id}`,
      kind: "random_memory",
      memoryId: firstMemory.id,
      label: firstMemory.title ? `Revisit "${firstMemory.title}"` : "Revisit a memory"
    });
  }

  for (const memory of resurfacingMemories.filter((item) => tagsForMemoryArchive(archive, item.id).length === 0).slice(0, 3)) {
    prompts.push({
      id: `unfinished:${memory.id}`,
      kind: "unfinished_memory",
      memoryId: memory.id,
      label: memory.title ? `Add tags to "${memory.title}"` : "Add tags to an unfinished memory"
    });
  }

  const tag = mostUsedTag(archive, new Set(resurfacingMemories.map((memory) => memory.id)));
  if (tag) {
    prompts.push({
      id: `tag:${tag.id}`,
      kind: "tag_prompt",
      tagId: tag.id,
      label: `Add another memory about ${tag.name}`
    });
  }

  return prompts;
}

function mostUsedTag(archive: MemoryArchive, memoryIds: Set<string>): { id: string; name: string } | undefined {
  const counts = new Map<string, number>();
  for (const link of archive.memoryTags.filter((item) => !item.rejected && memoryIds.has(item.memoryId))) {
    counts.set(link.tagId, (counts.get(link.tagId) ?? 0) + 1);
  }

  const [tagId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  return tagId ? archive.tags.find((tag) => tag.id === tagId) : undefined;
}

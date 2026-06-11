import type { MemoryArchive } from "./archive";
import type { DatePrecision, Memory, Tag } from "./types";

export type MemoryFilter = {
  text?: string;
  tagIds?: string[];
  tagTypes?: string[];
  datePrecisions?: DatePrecision[];
  sourceTypes?: string[];
  includeDeleted?: boolean;
};

export type TimelineBucket = {
  key: string;
  label: string;
  memories: Memory[];
};

export type ArchiveAuditSummary = {
  activeMemoryCount: number;
  deletedMemoryCount: number;
  tagCount: number;
  retainedAudioCount: number;
  inferredDateCount: number;
  confirmedDateCount: number;
  processingRunCount: number;
  lastExportedAt: string;
};

export function filterMemories(archive: MemoryArchive, filter: MemoryFilter = {}): Memory[] {
  const normalizedText = normalize(filter.text ?? "");
  const tagIds = new Set(filter.tagIds ?? []);
  const tagTypes = new Set(filter.tagTypes ?? []);
  const datePrecisions = new Set(filter.datePrecisions ?? []);
  const sourceTypes = new Set(filter.sourceTypes ?? []);

  return archive.memories
    .filter((memory) => filter.includeDeleted || !memory.deletedAt)
    .filter((memory) => {
      const tags = tagsForMemoryArchive(archive, memory.id);
      if (normalizedText && !memoryMatchesText(memory, tags, normalizedText)) return false;
      if (tagIds.size > 0 && !tags.some((tag) => tagIds.has(tag.id))) return false;
      if (tagTypes.size > 0 && !tags.some((tag) => tagTypes.has(tag.type))) return false;
      if (datePrecisions.size > 0 && !datePrecisions.has(memory.datePrecision)) return false;
      if (sourceTypes.size > 0 && !sourceTypes.has(memory.sourceType)) return false;
      return true;
    })
    .sort((a, b) => {
      const aDate = a.approximateStartDate ?? a.capturedAt ?? a.createdAt;
      const bDate = b.approximateStartDate ?? b.capturedAt ?? b.createdAt;
      return bDate.localeCompare(aDate);
    });
}

export function tagsForMemoryArchive(archive: MemoryArchive, memoryId: string): Tag[] {
  const tagsById = new Map(archive.tags.map((tag) => [tag.id, tag]));
  return archive.memoryTags
    .filter((link) => link.memoryId === memoryId && !link.rejected)
    .map((link) => tagsById.get(link.tagId))
    .filter((tag): tag is Tag => Boolean(tag))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function renameTag(archive: MemoryArchive, tagId: string, nextName: string): MemoryArchive {
  const normalizedName = normalizeTagName(nextName);
  if (!normalizedName) return archive;

  const now = new Date().toISOString();
  return {
    ...archive,
    tags: archive.tags.map((tag) =>
      tag.id === tagId
        ? {
            ...tag,
            name: nextName.trim(),
            normalizedName,
            updatedAt: now
          }
        : tag
    )
  };
}

export function deleteTag(archive: MemoryArchive, tagId: string): MemoryArchive {
  return {
    ...archive,
    tags: archive.tags.filter((tag) => tag.id !== tagId),
    memoryTags: archive.memoryTags.filter((link) => link.tagId !== tagId)
  };
}

export function restoreMemory(archive: MemoryArchive, memoryId: string): MemoryArchive {
  const now = new Date().toISOString();
  return {
    ...archive,
    memories: archive.memories.map((memory) => {
      if (memory.id !== memoryId) return memory;
      const { deletedAt: _deletedAt, ...rest } = memory;
      return { ...rest, updatedAt: now };
    })
  };
}

export function permanentlyDeleteMemory(archive: MemoryArchive, memoryId: string): MemoryArchive {
  return {
    ...archive,
    memories: archive.memories.filter((memory) => memory.id !== memoryId),
    memoryTags: archive.memoryTags.filter((link) => link.memoryId !== memoryId)
  };
}

export function buildTimelineBuckets(memories: Memory[]): TimelineBucket[] {
  const bucketMap = new Map<string, TimelineBucket>();

  for (const memory of memories) {
    const key = timelineKey(memory);
    const existing = bucketMap.get(key);
    if (existing) {
      existing.memories.push(memory);
    } else {
      bucketMap.set(key, {
        key,
        label: timelineLabel(key),
        memories: [memory]
      });
    }
  }

  return [...bucketMap.values()].sort((a, b) => compareTimelineKeys(a.key, b.key));
}

export function summarizeArchive(archive: MemoryArchive): ArchiveAuditSummary {
  const activeMemories = archive.memories.filter((memory) => !memory.deletedAt);
  return {
    activeMemoryCount: activeMemories.length,
    deletedMemoryCount: archive.memories.length - activeMemories.length,
    tagCount: archive.tags.length,
    retainedAudioCount: archive.memories.filter((memory) => memory.isAudioRetained).length,
    inferredDateCount: activeMemories.filter((memory) => !memory.userDateConfirmed && memory.datePrecision !== "unknown").length,
    confirmedDateCount: activeMemories.filter((memory) => memory.userDateConfirmed).length,
    processingRunCount: archive.processingRuns.length,
    lastExportedAt: archive.exportedAt
  };
}

export function normalizeTagName(value: string): string {
  return normalize(value).replace(/\s+/g, " ");
}

function memoryMatchesText(memory: Memory, tags: Tag[], normalizedText: string): boolean {
  const haystack = normalize(
    [memory.title, memory.rawText, memory.cleanedText, memory.summary, ...tags.map((tag) => tag.name)].filter(Boolean).join(" ")
  );
  return haystack.includes(normalizedText);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function timelineKey(memory: Memory): string {
  if (memory.approximateStartDate) return memory.approximateStartDate.slice(0, 4);
  if (memory.capturedAt) return memory.capturedAt.slice(0, 4);
  if (memory.createdAt) return memory.createdAt.slice(0, 4);
  return "unknown";
}

function timelineLabel(key: string): string {
  return key === "unknown" ? "Unknown date" : key;
}

function compareTimelineKeys(a: string, b: string): number {
  if (a === "unknown") return 1;
  if (b === "unknown") return -1;
  return b.localeCompare(a);
}

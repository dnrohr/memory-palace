import type { MemoryArchive } from "./archive";
import type { DatePrecision, Memory, Tag, TagType } from "./types";

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
  entries: TimelineEntry[];
};

export type TimelineEntry = {
  memory: Memory;
  dateLabel: string;
  certainty: "confirmed" | "inferred" | "unknown";
  span: "point" | "range" | "unknown";
};

export type TimelineBucketFilter = {
  certainties?: TimelineEntry["certainty"][];
  spans?: TimelineEntry["span"][];
  fromYear?: number;
  toYear?: number;
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

export type ArchiveMergePreview = {
  incomingMemoryCount: number;
  newMemoryCount: number;
  duplicateMemoryCount: number;
  newTagCount: number;
  conflicts: ArchiveMergeConflict[];
  warnings: string[];
};

export type ArchiveMergeConflict =
  | {
      kind: "duplicate_memory";
      incomingId: string;
      existingId: string;
      title?: string;
    }
  | {
      kind: "memory_id_conflict";
      memoryId: string;
      existingTitle?: string;
      incomingTitle?: string;
    }
  | {
      kind: "tag_type_conflict";
      tagName: string;
      existingType: TagType;
      incomingType: TagType;
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

export function updateTagType(archive: MemoryArchive, tagId: string, type: TagType): MemoryArchive {
  const now = new Date().toISOString();
  return {
    ...archive,
    tags: archive.tags.map((tag) => (tag.id === tagId ? { ...tag, type, updatedAt: now } : tag))
  };
}

export function mergeTags(archive: MemoryArchive, sourceTagId: string, targetTagId: string): MemoryArchive {
  if (sourceTagId === targetTagId) return archive;

  const existingLinks = new Set<string>();
  const nextLinks = [];

  for (const link of archive.memoryTags) {
    const tagId = link.tagId === sourceTagId ? targetTagId : link.tagId;
    const key = `${link.memoryId}:${tagId}`;
    if (existingLinks.has(key)) continue;
    existingLinks.add(key);
    nextLinks.push({ ...link, tagId });
  }

  return {
    ...archive,
    tags: archive.tags.filter((tag) => tag.id !== sourceTagId),
    memoryTags: nextLinks
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

export function appendMemoryAddendum(
  archive: MemoryArchive,
  memoryId: string,
  addendum: string,
  now = new Date().toISOString()
): MemoryArchive {
  const trimmed = addendum.trim();
  if (!trimmed) return archive;

  return {
    ...archive,
    memories: archive.memories.map((memory) => {
      if (memory.id !== memoryId) return memory;
      const nextText = `${memory.rawText}\n\nAddendum (${now.slice(0, 10)}): ${trimmed}`;
      return {
        ...memory,
        rawText: nextText,
        cleanedText: nextText,
        updatedAt: now
      };
    })
  };
}

export function buildTimelineBuckets(memories: Memory[]): TimelineBucket[] {
  const bucketMap = new Map<string, TimelineBucket>();

  for (const memory of memories) {
    const key = timelineKey(memory);
    const existing = bucketMap.get(key);
    if (existing) {
      existing.memories.push(memory);
      existing.entries.push(timelineEntry(memory));
    } else {
      bucketMap.set(key, {
        key,
        label: timelineLabel(key),
        memories: [memory],
        entries: [timelineEntry(memory)]
      });
    }
  }

  return [...bucketMap.values()].sort((a, b) => compareTimelineKeys(a.key, b.key));
}

export function filterTimelineBuckets(buckets: TimelineBucket[], filter: TimelineBucketFilter): TimelineBucket[] {
  const certainties = new Set(filter.certainties ?? []);
  const spans = new Set(filter.spans ?? []);

  return buckets
    .map((bucket) => {
      const entries = bucket.entries.filter((entry) => {
        if (certainties.size > 0 && !certainties.has(entry.certainty)) return false;
        if (spans.size > 0 && !spans.has(entry.span)) return false;
        if (bucket.key !== "unknown") {
          const year = Number(bucket.key);
          if (filter.fromYear !== undefined && year < filter.fromYear) return false;
          if (filter.toYear !== undefined && year > filter.toYear) return false;
        }
        return true;
      });

      return {
        ...bucket,
        entries,
        memories: entries.map((entry) => entry.memory)
      };
    })
    .filter((bucket) => bucket.entries.length > 0);
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

export function previewArchiveMerge(current: MemoryArchive, incoming: MemoryArchive): ArchiveMergePreview {
  const currentMemoryKeys = new Map(current.memories.map((memory) => [memoryDeduplicationKey(memory), memory]));
  const currentMemoriesById = new Map(current.memories.map((memory) => [memory.id, memory]));
  const currentTagsByName = new Map(current.tags.map((tag) => [tag.normalizedName, tag]));
  const conflicts: ArchiveMergeConflict[] = [];

  for (const memory of incoming.memories) {
    const duplicate = currentMemoryKeys.get(memoryDeduplicationKey(memory));
    if (duplicate) {
      conflicts.push({
        kind: "duplicate_memory",
        incomingId: memory.id,
        existingId: duplicate.id,
        ...(memory.title ? { title: memory.title } : {})
      });
      continue;
    }

    const existingById = currentMemoriesById.get(memory.id);
    if (existingById) {
      conflicts.push({
        kind: "memory_id_conflict",
        memoryId: memory.id,
        ...(existingById.title ? { existingTitle: existingById.title } : {}),
        ...(memory.title ? { incomingTitle: memory.title } : {})
      });
    }
  }

  for (const tag of incoming.tags) {
    const existing = currentTagsByName.get(tag.normalizedName);
    if (existing && existing.type !== tag.type) {
      conflicts.push({
        kind: "tag_type_conflict",
        tagName: tag.name,
        existingType: existing.type,
        incomingType: tag.type
      });
    }
  }

  const currentMemoryKeySet = new Set(currentMemoryKeys.keys());
  const currentTagNames = new Set(currentTagsByName.keys());
  const duplicateMemoryCount = incoming.memories.filter((memory) => currentMemoryKeySet.has(memoryDeduplicationKey(memory))).length;
  const newTagCount = incoming.tags.filter((tag) => !currentTagNames.has(tag.normalizedName)).length;

  return {
    incomingMemoryCount: incoming.memories.length,
    newMemoryCount: incoming.memories.length - duplicateMemoryCount,
    duplicateMemoryCount,
    newTagCount,
    conflicts,
    warnings: incoming.schemaVersion !== current.schemaVersion ? ["Incoming archive schema differs from current schema."] : []
  };
}

export function mergeArchive(current: MemoryArchive, incoming: MemoryArchive): MemoryArchive {
  const currentMemoryKeys = new Set(current.memories.map(memoryDeduplicationKey));
  const currentTagByName = new Map(current.tags.map((tag) => [tag.normalizedName, tag]));
  const tagIdRemap = new Map<string, string>();
  const nextTags = [...current.tags];

  for (const tag of incoming.tags) {
    const existing = currentTagByName.get(tag.normalizedName);
    if (existing) {
      tagIdRemap.set(tag.id, existing.id);
    } else {
      currentTagByName.set(tag.normalizedName, tag);
      tagIdRemap.set(tag.id, tag.id);
      nextTags.push(tag);
    }
  }

  const incomingMemories = incoming.memories.filter((memory) => !currentMemoryKeys.has(memoryDeduplicationKey(memory)));
  const incomingMemoryIds = new Set(incomingMemories.map((memory) => memory.id));
  const existingLinks = new Set(current.memoryTags.map((link) => `${link.memoryId}:${link.tagId}`));
  const nextLinks = [...current.memoryTags];

  for (const link of incoming.memoryTags) {
    if (!incomingMemoryIds.has(link.memoryId)) continue;
    const tagId = tagIdRemap.get(link.tagId);
    if (!tagId) continue;
    const key = `${link.memoryId}:${tagId}`;
    if (existingLinks.has(key)) continue;
    existingLinks.add(key);
    nextLinks.push({ ...link, tagId });
  }

  return {
    ...current,
    exportedAt: new Date().toISOString(),
    memories: [...incomingMemories, ...current.memories],
    tags: nextTags,
    memoryTags: nextLinks,
    people: mergeById(current.people, incoming.people),
    pets: mergeById(current.pets, incoming.pets),
    places: mergeById(current.places, incoming.places),
    lifePeriods: mergeById(current.lifePeriods, incoming.lifePeriods),
    processingRuns: [...current.processingRuns, ...incoming.processingRuns]
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

function timelineEntry(memory: Memory): TimelineEntry {
  const hasStart = Boolean(memory.approximateStartDate);
  const hasEnd = Boolean(memory.approximateEndDate);
  const hasApproximateDate = hasStart || hasEnd;

  return {
    memory,
    dateLabel: formatTimelineDate(memory),
    certainty: !hasApproximateDate ? "unknown" : memory.userDateConfirmed ? "confirmed" : "inferred",
    span: !hasApproximateDate ? "unknown" : hasStart && hasEnd ? "range" : "point"
  };
}

function formatTimelineDate(memory: Memory): string {
  if (memory.approximateStartDate && memory.approximateEndDate) {
    return `${memory.approximateStartDate} to ${memory.approximateEndDate}`;
  }

  return memory.approximateStartDate ?? memory.approximateEndDate ?? "Unknown date";
}

function compareTimelineKeys(a: string, b: string): number {
  if (a === "unknown") return 1;
  if (b === "unknown") return -1;
  return b.localeCompare(a);
}

function memoryDeduplicationKey(memory: Memory): string {
  return normalize([memory.rawText, memory.approximateStartDate ?? "", memory.title ?? ""].join("|"));
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

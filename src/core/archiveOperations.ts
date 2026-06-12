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

export type ArchiveMergeOptions = {
  duplicateMemory?: "skip" | "import_copy";
  memoryIdConflict?: "skip" | "replace" | "keep_both";
  tagTypeConflict?: "keep_existing" | "use_incoming";
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
  const nextEmbeddings = archive.memoryEmbeddings?.filter((embedding) => embedding.memoryId !== memoryId);

  return {
    ...archive,
    memories: archive.memories.filter((memory) => memory.id !== memoryId),
    memoryTags: archive.memoryTags.filter((link) => link.memoryId !== memoryId),
    ...(nextEmbeddings ? { memoryEmbeddings: nextEmbeddings } : {})
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

export function updateMemorySafety(
  archive: MemoryArchive,
  memoryId: string,
  safety: Pick<Memory, "isSensitive" | "excludeFromResurfacing" | "showLessLikeThis">,
  now = new Date().toISOString()
): MemoryArchive {
  return {
    ...archive,
    memories: archive.memories.map((memory) =>
      memory.id === memoryId
        ? {
            ...memory,
            isSensitive: Boolean(safety.isSensitive),
            excludeFromResurfacing: Boolean(safety.excludeFromResurfacing || safety.showLessLikeThis),
            showLessLikeThis: Boolean(safety.showLessLikeThis),
            updatedAt: now
          }
        : memory
    )
  };
}

export function updateMemoryPrivateNotes(
  archive: MemoryArchive,
  memoryId: string,
  privateNotes: string,
  now = new Date().toISOString()
): MemoryArchive {
  const trimmed = privateNotes.trim();
  return {
    ...archive,
    memories: archive.memories.map((memory) => {
      if (memory.id !== memoryId) return memory;
      const { privateNotes: _privateNotes, ...rest } = memory;
      return {
        ...rest,
        ...(trimmed ? { privateNotes: trimmed } : {}),
        updatedAt: now
      };
    })
  };
}

export function splitMemory(
  archive: MemoryArchive,
  memoryId: string,
  splitIndex: number,
  now = new Date().toISOString()
): MemoryArchive {
  const memory = archive.memories.find((item) => item.id === memoryId);
  if (!memory) return archive;

  const text = memory.cleanedText ?? memory.rawText;
  if (splitIndex <= 0 || splitIndex >= text.length) return archive;

  const firstText = text.slice(0, splitIndex).trim();
  const secondText = text.slice(splitIndex).trim();
  if (!firstText || !secondText) return archive;

  const newMemoryId = uniqueArchiveId(`${memoryId}_split`, new Set(archive.memories.map((item) => item.id)));
  const { audioUri: _audioUri, ...memoryWithoutAudio } = memory;
  const nextMemory: Memory = {
    ...memoryWithoutAudio,
    id: newMemoryId,
    rawText: secondText,
    cleanedText: secondText,
    title: deriveMemoryTitle(secondText),
    createdAt: now,
    updatedAt: now,
    sourceType: "edit",
    isAudioRetained: false
  };
  const firstMemory: Memory = {
    ...memory,
    rawText: firstText,
    cleanedText: firstText,
    updatedAt: now,
    sourceType: "edit"
  };

  const memoryLinks = archive.memoryTags.filter((link) => link.memoryId === memoryId);
  const nextLinks = [
    ...archive.memoryTags,
    ...memoryLinks.map((link) => ({
      ...link,
      memoryId: newMemoryId,
      createdAt: now
    }))
  ];

  const nextEmbeddings = archive.memoryEmbeddings?.filter((embedding) => embedding.memoryId !== memoryId);

  return {
    ...archive,
    memories: archive.memories.flatMap((item) => (item.id === memoryId ? [firstMemory, nextMemory] : [item])),
    memoryTags: nextLinks,
    ...(nextEmbeddings ? { memoryEmbeddings: nextEmbeddings } : {})
  };
}

export function mergeMemories(
  archive: MemoryArchive,
  targetMemoryId: string,
  sourceMemoryId: string,
  now = new Date().toISOString()
): MemoryArchive {
  if (targetMemoryId === sourceMemoryId) return archive;

  const target = archive.memories.find((memory) => memory.id === targetMemoryId);
  const source = archive.memories.find((memory) => memory.id === sourceMemoryId);
  if (!target || !source) return archive;

  const targetText = target.cleanedText ?? target.rawText;
  const sourceText = source.cleanedText ?? source.rawText;
  const mergedText = `${targetText.trim()}\n\nMerged memory (${now.slice(0, 10)}):\n${sourceText.trim()}`;
  const mergedMemory: Memory = {
    ...target,
    rawText: mergedText,
    cleanedText: mergedText,
    updatedAt: now,
    sourceType: "edit"
  };

  const existingLinks = new Set<string>();
  const nextLinks = [];
  for (const link of archive.memoryTags) {
    if (link.memoryId === sourceMemoryId) {
      const key = `${targetMemoryId}:${link.tagId}:${link.rejected ? "rejected" : "active"}`;
      if (existingLinks.has(key)) continue;
      existingLinks.add(key);
      nextLinks.push({ ...link, memoryId: targetMemoryId, createdAt: now });
      continue;
    }
    const key = `${link.memoryId}:${link.tagId}:${link.rejected ? "rejected" : "active"}`;
    if (!existingLinks.has(key)) {
      existingLinks.add(key);
      nextLinks.push(link);
    }
  }

  const nextEmbeddings = archive.memoryEmbeddings?.filter(
    (embedding) => embedding.memoryId !== targetMemoryId && embedding.memoryId !== sourceMemoryId
  );

  return {
    ...archive,
    memories: archive.memories
      .filter((memory) => memory.id !== sourceMemoryId)
      .map((memory) => (memory.id === targetMemoryId ? mergedMemory : memory)),
    memoryTags: nextLinks,
    ...(nextEmbeddings ? { memoryEmbeddings: nextEmbeddings } : {})
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

export function mergeArchive(current: MemoryArchive, incoming: MemoryArchive, options: ArchiveMergeOptions = {}): MemoryArchive {
  const duplicateMemoryResolution = options.duplicateMemory ?? "skip";
  const memoryIdResolution = options.memoryIdConflict ?? "skip";
  const tagTypeResolution = options.tagTypeConflict ?? "keep_existing";
  const currentMemoryKeys = new Map(current.memories.map((memory) => [memoryDeduplicationKey(memory), memory.id]));
  const currentMemoryIds = new Set(current.memories.map((memory) => memory.id));
  const currentTagByName = new Map(current.tags.map((tag) => [tag.normalizedName, tag]));
  const tagIdRemap = new Map<string, string>();
  const nextTags = [...current.tags];

  for (const tag of incoming.tags) {
    const existing = currentTagByName.get(tag.normalizedName);
    if (existing) {
      if (existing.type !== tag.type && tagTypeResolution === "use_incoming") {
        const nextTag = { ...existing, type: tag.type, updatedAt: tag.updatedAt };
        const index = nextTags.findIndex((item) => item.id === existing.id);
        if (index >= 0) nextTags[index] = nextTag;
        currentTagByName.set(tag.normalizedName, nextTag);
      }
      tagIdRemap.set(tag.id, existing.id);
    } else {
      currentTagByName.set(tag.normalizedName, tag);
      tagIdRemap.set(tag.id, tag.id);
      nextTags.push(tag);
    }
  }

  const usedMemoryIds = new Set(currentMemoryIds);
  const incomingMemoryIdRemap = new Map<string, string>();
  const acceptedMemories: Memory[] = [];
  let nextCurrentMemories = [...current.memories];
  let nextLinks = [...current.memoryTags];

  for (const memory of incoming.memories) {
    const duplicateExistingId = currentMemoryKeys.get(memoryDeduplicationKey(memory));
    if (duplicateExistingId && duplicateMemoryResolution === "skip") continue;

    const hasIdConflict = usedMemoryIds.has(memory.id);
    if (hasIdConflict && memoryIdResolution === "skip") continue;

    let nextMemory = memory;
    if (hasIdConflict && memoryIdResolution === "replace") {
      nextCurrentMemories = nextCurrentMemories.filter((item) => item.id !== memory.id);
      nextLinks = nextLinks.filter((link) => link.memoryId !== memory.id);
    } else if (hasIdConflict) {
      nextMemory = { ...memory, id: uniqueImportedMemoryId(memory.id, usedMemoryIds) };
    }

    usedMemoryIds.add(nextMemory.id);
    incomingMemoryIdRemap.set(memory.id, nextMemory.id);
    acceptedMemories.push(nextMemory);
  }

  const existingLinks = new Set(nextLinks.map((link) => `${link.memoryId}:${link.tagId}`));

  for (const link of incoming.memoryTags) {
    const memoryId = incomingMemoryIdRemap.get(link.memoryId);
    if (!memoryId) continue;
    const tagId = tagIdRemap.get(link.tagId);
    if (!tagId) continue;
    const key = `${memoryId}:${tagId}`;
    if (existingLinks.has(key)) continue;
    existingLinks.add(key);
    nextLinks.push({ ...link, memoryId, tagId });
  }

  return {
    ...current,
    exportedAt: new Date().toISOString(),
    memories: [...acceptedMemories, ...nextCurrentMemories],
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

function uniqueImportedMemoryId(baseId: string, usedIds: Set<string>): string {
  return uniqueArchiveId(`${baseId}-imported`, usedIds);
}

function uniqueArchiveId(baseId: string, usedIds: Set<string>): string {
  let index = 1;
  let candidate = baseId;
  while (usedIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}-${index}`;
  }
  return candidate;
}

function deriveMemoryTitle(text: string): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return "Untitled memory";
  return firstSentence.length > 48 ? `${firstSentence.slice(0, 45)}...` : firstSentence;
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

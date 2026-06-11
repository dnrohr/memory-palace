import type { MemoryArchive } from "../core/archive";
import { normalizeTagName } from "../core/archiveOperations";
import { extractDateCandidates } from "./rules/dateExtraction";
import { suggestTags } from "./rules/tagSuggestion";

export type ReviewItem =
  | {
      id: string;
      memoryId: string;
      type: "tag_suggestion";
      label: string;
      confidence: number;
    }
  | {
      id: string;
      memoryId: string;
      type: "date_suggestion";
      label: string;
      confidence: number;
      startDate?: string;
      endDate?: string;
    }
  | {
      id: string;
      memoryId: string;
      type: "untagged_memory";
      label: string;
      confidence: number;
    };

export function buildReviewInbox(archive: MemoryArchive): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const memory of archive.memories.filter((item) => !item.deletedAt)) {
    const links = archive.memoryTags.filter((link) => link.memoryId === memory.id && !link.rejected);
    const reviewedLinks = archive.memoryTags.filter((link) => link.memoryId === memory.id);
    const existingTagNames = new Set(
      reviewedLinks
        .map((link) => archive.tags.find((tag) => tag.id === link.tagId)?.normalizedName)
        .filter((name): name is string => Boolean(name))
    );

    if (links.length === 0) {
      items.push({
        id: `${memory.id}:untagged`,
        memoryId: memory.id,
        type: "untagged_memory",
        label: memory.title ?? "Untagged memory",
        confidence: 1
      });
    }

    for (const suggestion of suggestTags(memory.cleanedText ?? memory.rawText)) {
      if (existingTagNames.has(suggestion.name.toLocaleLowerCase())) continue;
      items.push({
        id: `${memory.id}:tag:${suggestion.name}`,
        memoryId: memory.id,
        type: "tag_suggestion",
        label: suggestion.name,
        confidence: suggestion.confidence
      });
    }

    if (memory.datePrecision === "unknown" || !memory.userDateConfirmed) {
      for (const candidate of extractDateCandidates(memory.cleanedText ?? memory.rawText)) {
        items.push({
          id: `${memory.id}:date:${candidate.label}`,
          memoryId: memory.id,
          type: "date_suggestion",
          label: candidate.label,
          confidence: candidate.confidence,
          ...(candidate.startDate ? { startDate: candidate.startDate } : {}),
          ...(candidate.endDate ? { endDate: candidate.endDate } : {})
        });
      }
    }
  }

  return items.sort((a, b) => b.confidence - a.confidence || a.label.localeCompare(b.label));
}

export function acceptReviewItem(archive: MemoryArchive, item: ReviewItem): MemoryArchive {
  const now = new Date().toISOString();

  if (item.type === "tag_suggestion") {
    const normalizedName = normalizeTagName(item.label);
    const existingTag = archive.tags.find((tag) => tag.normalizedName === normalizedName);
    const tag =
      existingTag ??
      {
        id: `tag_${normalizedName.replace(/[^a-z0-9]+/g, "_")}`,
        name: item.label,
        normalizedName,
        type: "custom" as const,
        createdAt: now,
        updatedAt: now,
        isUserCreated: false
      };
    const linkExists = archive.memoryTags.some((link) => link.memoryId === item.memoryId && link.tagId === tag.id);

    return {
      ...archive,
      tags: existingTag ? archive.tags : [...archive.tags, tag],
      memoryTags: linkExists
        ? archive.memoryTags
        : [
            ...archive.memoryTags,
            {
              memoryId: item.memoryId,
              tagId: tag.id,
              source: "inferred",
              confidence: item.confidence,
              userConfirmed: true,
              rejected: false,
              createdAt: now
            }
          ]
    };
  }

  if (item.type === "date_suggestion") {
    return {
      ...archive,
      memories: archive.memories.map((memory) =>
        memory.id === item.memoryId
          ? {
              ...memory,
              ...(item.startDate ? { approximateStartDate: item.startDate } : {}),
              ...(item.endDate ? { approximateEndDate: item.endDate } : {}),
              datePrecision: "year",
              dateConfidence: item.confidence,
              dateExplanation: `Accepted review suggestion "${item.label}".`,
              userDateConfirmed: true,
              updatedAt: now
            }
          : memory
      )
    };
  }

  return archive;
}

export function rejectReviewItem(archive: MemoryArchive, item: ReviewItem): MemoryArchive {
  if (item.type !== "tag_suggestion") return archive;

  const now = new Date().toISOString();
  const normalizedName = normalizeTagName(item.label);
  const existingTag = archive.tags.find((tag) => tag.normalizedName === normalizedName);
  const tag =
    existingTag ??
    {
      id: `tag_${normalizedName.replace(/[^a-z0-9]+/g, "_")}`,
      name: item.label,
      normalizedName,
      type: "custom" as const,
      createdAt: now,
      updatedAt: now,
      isUserCreated: false
    };

  return {
    ...archive,
    tags: existingTag ? archive.tags : [...archive.tags, tag],
    memoryTags: [
      ...archive.memoryTags.filter((link) => !(link.memoryId === item.memoryId && link.tagId === tag.id)),
      {
        memoryId: item.memoryId,
        tagId: tag.id,
        source: "inferred",
        confidence: item.confidence,
        userConfirmed: false,
        rejected: true,
        createdAt: now
      }
    ]
  };
}

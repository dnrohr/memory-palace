import type { MemoryArchive } from "../core/archive";
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
    const existingTagNames = new Set(
      links
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


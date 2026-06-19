import type { MemoryArchive } from "../core/archive";
import { tagsForMemoryArchive } from "../core/archiveOperations";
import type { DatePrecision, Memory, Tag, TagType } from "../core/types";

export type ExploreFilterSuggestionType = "tag" | "person" | "place" | "date" | "text";
export type ExploreFilterSuggestionGroupLabel = "Tags" | "People" | "Places" | "Dates" | "Text";

export type ExploreFilterSuggestion = {
  id: string;
  label: string;
  type: ExploreFilterSuggestionType;
  value: string;
  count?: number;
  snippet?: string;
};

export type ExploreFilterSuggestionGroup = {
  label: ExploreFilterSuggestionGroupLabel;
  suggestions: ExploreFilterSuggestion[];
};

export type ExploreFilterSuggestionInput = {
  archive: MemoryArchive;
  query?: string;
  activeTagIds?: string[];
  activeDatePrecision?: DatePrecision;
  limitPerGroup?: number;
  includeTextMatches?: boolean;
};

type RankedSuggestion = ExploreFilterSuggestion & { rank: number };

const DEFAULT_LIMIT_PER_GROUP = 4;
const TAG_GROUPS: Array<{ label: ExploreFilterSuggestionGroupLabel; tagTypes?: TagType[] }> = [
  { label: "People", tagTypes: ["person", "pet"] },
  { label: "Places", tagTypes: ["place"] },
  { label: "Tags" }
];
const DATE_LABELS: Record<DatePrecision, string> = {
  exact: "Exact dates",
  day: "Day dates",
  month: "Month dates",
  year: "Year-only dates",
  range: "Date ranges",
  age: "Age memories",
  grade: "School-grade memories",
  decade: "Decade memories",
  unknown: "Unknown dates"
};

export function buildExploreFilterSuggestionGroups(input: ExploreFilterSuggestionInput): ExploreFilterSuggestionGroup[] {
  const query = normalize(input.query ?? "");
  const limit = input.limitPerGroup ?? DEFAULT_LIMIT_PER_GROUP;
  const activeTagIds = new Set(input.activeTagIds ?? []);
  const activeDatePrecision = input.activeDatePrecision;
  const groups: ExploreFilterSuggestionGroup[] = [];
  const tagCounts = countActiveTags(input.archive);

  for (const group of TAG_GROUPS) {
    const suggestions = input.archive.tags
      .filter((tag) => !activeTagIds.has(tag.id))
      .filter((tag) => (group.tagTypes ? group.tagTypes.includes(tag.type) : !["person", "pet", "place"].includes(tag.type)))
      .map((tag) => tagToSuggestion(tag, tagCounts.get(tag.id) ?? 0, query))
      .filter((suggestion): suggestion is RankedSuggestion => Boolean(suggestion))
      .sort(compareRankedSuggestions)
      .slice(0, limit)
      .map(({ rank: _rank, ...suggestion }) => suggestion);

    if (suggestions.length > 0) {
      groups.push({ label: group.label, suggestions });
    }
  }

  const dateSuggestions = buildDateSuggestions(input.archive, query, activeDatePrecision).slice(0, limit);
  if (dateSuggestions.length > 0) {
    groups.push({ label: "Dates", suggestions: dateSuggestions });
  }

  if (query && input.includeTextMatches) {
    const textSuggestions = buildTextSuggestions(input.archive, query).slice(0, limit);
    if (textSuggestions.length > 0) {
      groups.push({ label: "Text", suggestions: textSuggestions });
    }
  }

  return groups;
}

function tagToSuggestion(tag: Tag, count: number, query: string): RankedSuggestion | undefined {
  const normalizedName = normalize(tag.name);
  const rank = matchRank(normalizedName, query);
  if (rank === undefined || count === 0) return undefined;

  const type: ExploreFilterSuggestionType = tag.type === "person" || tag.type === "pet" ? "person" : tag.type === "place" ? "place" : "tag";
  return {
    id: `tag:${tag.id}`,
    label: tag.name,
    type,
    value: tag.id,
    count,
    rank
  };
}

function buildDateSuggestions(
  archive: MemoryArchive,
  query: string,
  activeDatePrecision: DatePrecision | undefined
): RankedSuggestion[] {
  const counts = new Map<DatePrecision, number>();
  for (const memory of archive.memories) {
    if (memory.deletedAt) continue;
    counts.set(memory.datePrecision, (counts.get(memory.datePrecision) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([precision, count]) => count > 0 && precision !== activeDatePrecision)
    .flatMap(([precision, count]) => {
      const label = DATE_LABELS[precision];
      const rank = matchRank(normalize(`${label} ${precision}`), query);
      return rank === undefined
        ? []
        : {
            id: `date:${precision}`,
            label,
            type: "date" as const,
            value: precision,
            count,
            rank
          };
    })
    .sort(compareRankedSuggestions);
}

function buildTextSuggestions(archive: MemoryArchive, query: string): ExploreFilterSuggestion[] {
  return archive.memories
    .filter((memory) => !memory.deletedAt)
    .flatMap((memory) => {
      const haystack = memorySearchText(archive, memory);
      const rank = matchRank(normalize(haystack), query);
      if (rank === undefined) return [];
      return {
        id: `text:${memory.id}`,
        label: memory.title || firstSentence(memory.rawText),
        type: "text" as const,
        value: query,
        snippet: snippetForQuery(haystack, query),
        rank
      };
    })
    .sort(compareRankedSuggestions)
    .map(({ rank: _rank, ...suggestion }) => suggestion);
}

function countActiveTags(archive: MemoryArchive): Map<string, number> {
  const activeMemoryIds = new Set(archive.memories.filter((memory) => !memory.deletedAt).map((memory) => memory.id));
  const counts = new Map<string, number>();
  for (const link of archive.memoryTags) {
    if (link.rejected || !activeMemoryIds.has(link.memoryId)) continue;
    counts.set(link.tagId, (counts.get(link.tagId) ?? 0) + 1);
  }
  return counts;
}

function memorySearchText(archive: MemoryArchive, memory: Memory): string {
  const tags = tagsForMemoryArchive(archive, memory.id).map((tag) => tag.name);
  return [memory.title, memory.summary, memory.cleanedText, memory.rawText, ...tags].filter(Boolean).join(" ");
}

function matchRank(value: string, query: string): number | undefined {
  if (!query) return 0;
  if (value === query) return 0;
  if (value.startsWith(query)) return 1;
  const wordPrefix = value.split(/\s+/).some((word) => word.startsWith(query));
  if (wordPrefix) return 2;
  if (value.includes(query)) return 3;
  return undefined;
}

function compareRankedSuggestions(
  a: RankedSuggestion,
  b: RankedSuggestion
): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  if ((a.count ?? 0) !== (b.count ?? 0)) return (b.count ?? 0) - (a.count ?? 0);
  return a.label.localeCompare(b.label);
}

function snippetForQuery(text: string, query: string): string {
  const normalizedText = normalize(text);
  const index = normalizedText.indexOf(query);
  if (index < 0) return firstSentence(text);
  const start = Math.max(0, index - 32);
  const end = Math.min(text.length, index + query.length + 48);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function firstSentence(text: string): string {
  return text.split(/[.!?]/)[0]?.trim() || text.slice(0, 48).trim();
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

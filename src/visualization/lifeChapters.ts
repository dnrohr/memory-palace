import type { MemoryArchive } from "../core/archive";
import { buildTimelineBuckets } from "../core/archiveOperations";
import { buildTagClusters } from "./clusters";

export type LifeChapterCandidate = {
  id: string;
  name: string;
  memoryIds: string[];
  basis: "timeline" | "tag_cluster" | "life_period";
  editable: true;
};

export function buildLifeChapterCandidates(archive: MemoryArchive): LifeChapterCandidate[] {
  const activeMemories = archive.memories.filter((memory) => !memory.deletedAt);
  const chapters: LifeChapterCandidate[] = [];

  for (const bucket of buildTimelineBuckets(activeMemories)) {
    if (bucket.memories.length === 0) continue;
    chapters.push({
      id: `timeline:${bucket.key}`,
      name: bucket.label,
      memoryIds: bucket.memories.map((memory) => memory.id),
      basis: "timeline",
      editable: true
    });
  }

  for (const cluster of buildTagClusters(archive, 2)) {
    chapters.push({
      id: `cluster:${cluster.id}`,
      name: cluster.label,
      memoryIds: cluster.memoryIds,
      basis: "tag_cluster",
      editable: true
    });
  }

  for (const period of archive.lifePeriods) {
    const memoryIds = activeMemories
      .filter((memory) => {
        if (!period.startDate && !period.endDate) return false;
        const date = memory.approximateStartDate;
        if (!date) return false;
        if (period.startDate && date < period.startDate) return false;
        if (period.endDate && date > period.endDate) return false;
        return true;
      })
      .map((memory) => memory.id);

    if (memoryIds.length > 0) {
      chapters.push({
        id: `period:${period.id}`,
        name: period.name,
        memoryIds,
        basis: "life_period",
        editable: true
      });
    }
  }

  return chapters;
}


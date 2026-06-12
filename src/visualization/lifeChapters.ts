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

  return applyChapterDecisions(chapters, archive);
}

export function renameLifeChapterCandidate(
  archive: MemoryArchive,
  candidateId: string,
  name: string,
  now = new Date().toISOString()
): MemoryArchive {
  const trimmed = name.trim();
  if (!trimmed) return archive;

  return upsertChapterDecision(archive, {
    candidateId,
    action: "renamed",
    name: trimmed,
    updatedAt: now
  });
}

export function rejectLifeChapterCandidate(
  archive: MemoryArchive,
  candidateId: string,
  now = new Date().toISOString()
): MemoryArchive {
  return upsertChapterDecision(archive, {
    candidateId,
    action: "rejected",
    updatedAt: now
  });
}

export function mergeLifeChapterCandidate(
  archive: MemoryArchive,
  sourceCandidateId: string,
  targetCandidateId: string,
  now = new Date().toISOString()
): MemoryArchive {
  if (sourceCandidateId === targetCandidateId) return archive;

  return upsertChapterDecision(archive, {
    candidateId: sourceCandidateId,
    action: "merged",
    targetCandidateId,
    updatedAt: now
  });
}

export function splitLifeChapterCandidate(
  archive: MemoryArchive,
  candidateId: string,
  memoryIds: string[],
  name: string,
  now = new Date().toISOString()
): MemoryArchive {
  const uniqueMemoryIds = [...new Set(memoryIds)].filter(Boolean);
  const trimmed = name.trim();
  if (uniqueMemoryIds.length === 0 || !trimmed) return archive;

  return upsertChapterDecision(archive, {
    candidateId,
    action: "split",
    name: trimmed,
    memoryIds: uniqueMemoryIds,
    updatedAt: now
  });
}

function applyChapterDecisions(chapters: LifeChapterCandidate[], archive: MemoryArchive): LifeChapterCandidate[] {
  const decisions = new Map((archive.lifeChapterDecisions ?? []).map((decision) => [decision.candidateId, decision]));
  const chaptersById = new Map(chapters.map((chapter) => [chapter.id, { ...chapter, memoryIds: [...chapter.memoryIds] }]));

  for (const decision of decisions.values()) {
    if (decision.action === "merged" && decision.targetCandidateId) {
      const source = chaptersById.get(decision.candidateId);
      const target = chaptersById.get(decision.targetCandidateId);
      if (!source || !target) continue;
      target.memoryIds = [...new Set([...target.memoryIds, ...source.memoryIds])];
      chaptersById.set(decision.targetCandidateId, target);
    }
  }

  for (const decision of decisions.values()) {
    if (decision.action !== "split" || !decision.name || !decision.memoryIds?.length) continue;
    const source = chaptersById.get(decision.candidateId);
    if (!source) continue;
    const splitIds = new Set(decision.memoryIds);
    source.memoryIds = source.memoryIds.filter((memoryId) => !splitIds.has(memoryId));
    chaptersById.set(source.id, source);
    chaptersById.set(`split:${decision.candidateId}`, {
      id: `split:${decision.candidateId}`,
      name: decision.name,
      memoryIds: [...splitIds],
      basis: source.basis,
      editable: true
    });
  }

  return [...chaptersById.values()]
    .filter((chapter) => {
      const decision = decisions.get(chapter.id);
      return decision?.action !== "rejected" && decision?.action !== "merged" && chapter.memoryIds.length > 0;
    })
    .map((chapter) => {
      const decision = decisions.get(chapter.id);
      return decision?.action === "renamed" && decision.name ? { ...chapter, name: decision.name } : chapter;
    });
}

function upsertChapterDecision(archive: MemoryArchive, decision: NonNullable<MemoryArchive["lifeChapterDecisions"]>[number]): MemoryArchive {
  const decisions = archive.lifeChapterDecisions ?? [];
  return {
    ...archive,
    lifeChapterDecisions: [
      decision,
      ...decisions.filter((existing) => existing.candidateId !== decision.candidateId)
    ]
  };
}

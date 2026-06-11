import type { MemoryArchive } from "../core/archive";

export type DataAuditReport = {
  activeMemoryCount: number;
  deletedMemoryCount: number;
  retainedAudioCount: number;
  embeddingCount: number;
  processingRunCount: number;
  estimatedEmbeddingBytes: number;
  localProcessingModes: string[];
};

export function buildDataAuditReport(archive: MemoryArchive): DataAuditReport {
  const activeMemories = archive.memories.filter((memory) => !memory.deletedAt);
  const retainedAudioCount = archive.memories.filter((memory) => memory.isAudioRetained || memory.audioUri).length;
  const embeddingCount = archive.memoryEmbeddings?.length ?? 0;
  const estimatedEmbeddingBytes = (archive.memoryEmbeddings ?? []).reduce(
    (total, embedding) => total + embedding.values.length * Float64Array.BYTES_PER_ELEMENT,
    0
  );

  return {
    activeMemoryCount: activeMemories.length,
    deletedMemoryCount: archive.memories.length - activeMemories.length,
    retainedAudioCount,
    embeddingCount,
    processingRunCount: archive.processingRuns.length,
    estimatedEmbeddingBytes,
    localProcessingModes: [
      "rules metadata suggestions",
      "embedding index",
      "related memories",
      "keyword search"
    ]
  };
}

export function clearProcessingRuns(archive: MemoryArchive): MemoryArchive {
  return {
    ...archive,
    processingRuns: []
  };
}

export function clearRetainedAudioReferences(archive: MemoryArchive, now = new Date().toISOString()): MemoryArchive {
  return {
    ...archive,
    memories: archive.memories.map((memory) => {
      if (!memory.isAudioRetained && !memory.audioUri) return memory;
      const { audioUri: _audioUri, ...rest } = memory;
      return {
        ...rest,
        isAudioRetained: false,
        updatedAt: now
      };
    })
  };
}

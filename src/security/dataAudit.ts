import type { MemoryArchive } from "../core/archive";

export type DataAuditReport = {
  activeMemoryCount: number;
  deletedMemoryCount: number;
  retainedAudioCount: number;
  embeddingCount: number;
  processingRunCount: number;
  estimatedTextBytes: number;
  estimatedEmbeddingBytes: number;
  estimatedProcessingBytes: number;
  estimatedTotalLocalBytes: number;
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
  const estimatedTextBytes = archive.memories.reduce((total, memory) => {
    return total + utf8Bytes([memory.rawText, memory.cleanedText, memory.title, memory.summary].filter(Boolean).join("\n"));
  }, 0);
  const estimatedProcessingBytes = archive.processingRuns.reduce((total, run) => total + utf8Bytes(run.outputJson), 0);

  return {
    activeMemoryCount: activeMemories.length,
    deletedMemoryCount: archive.memories.length - activeMemories.length,
    retainedAudioCount,
    embeddingCount,
    processingRunCount: archive.processingRuns.length,
    estimatedTextBytes,
    estimatedEmbeddingBytes,
    estimatedProcessingBytes,
    estimatedTotalLocalBytes: estimatedTextBytes + estimatedEmbeddingBytes + estimatedProcessingBytes,
    localProcessingModes: [
      "rules metadata suggestions",
      "embedding index",
      "related memories",
      "keyword search"
    ]
  };
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
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

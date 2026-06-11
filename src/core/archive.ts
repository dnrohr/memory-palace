import type { Memory, MemoryTag, ProcessingRunRecord, Tag, UserProfile } from "./types";

export type MemoryArchive = {
  exportedAt: string;
  schemaVersion: string;
  memories: Memory[];
  tags: Tag[];
  memoryTags: MemoryTag[];
  userProfile?: UserProfile;
  processingRuns: ProcessingRunRecord[];
};

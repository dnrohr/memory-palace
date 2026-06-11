import type {
  LifePeriod,
  Memory,
  MemoryEmbeddingRecord,
  MemoryTag,
  Person,
  Pet,
  Place,
  ProcessingRunRecord,
  Tag,
  UserProfile
} from "./types";

export type MemoryArchive = {
  exportedAt: string;
  schemaVersion: string;
  memories: Memory[];
  tags: Tag[];
  memoryTags: MemoryTag[];
  people: Person[];
  pets: Pet[];
  places: Place[];
  lifePeriods: LifePeriod[];
  userProfile?: UserProfile;
  memoryEmbeddings?: MemoryEmbeddingRecord[];
  processingRuns: ProcessingRunRecord[];
};

import type {
  LifePeriod,
  LifeChapterDecision,
  LifeContextRelationship,
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
  lifeContextRelationships?: LifeContextRelationship[];
  lifeChapterDecisions?: LifeChapterDecision[];
  userProfile?: UserProfile;
  memoryEmbeddings?: MemoryEmbeddingRecord[];
  processingRuns: ProcessingRunRecord[];
};

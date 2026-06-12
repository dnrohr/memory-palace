export type DatePrecision =
  | "exact"
  | "day"
  | "month"
  | "year"
  | "range"
  | "age"
  | "grade"
  | "decade"
  | "unknown";

export type SourceType = "voice" | "typed" | "import" | "edit";

export type TagType =
  | "person"
  | "pet"
  | "place"
  | "time"
  | "object"
  | "emotion"
  | "theme"
  | "activity"
  | "life_period"
  | "custom";

export type SuggestionSource =
  | "explicit"
  | "imported"
  | "inferred"
  | "known_context"
  | "model"
  | "rule"
  | "user_history";

export type UserProfile = {
  id?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  preferredDatePrecision?: DatePrecision;
  allowInferredDates?: boolean;
  allowEmotionDetection?: boolean;
  allowAudioRetention?: boolean;
};

export type Memory = {
  id: string;
  rawText: string;
  cleanedText?: string;
  title?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  capturedAt?: string;
  sourceType: SourceType;
  audioUri?: string;
  isAudioRetained: boolean;
  approximateStartDate?: string;
  approximateEndDate?: string;
  datePrecision: DatePrecision;
  dateConfidence?: number;
  dateExplanation?: string;
  userDateConfirmed: boolean;
  isSensitive?: boolean;
  excludeFromResurfacing?: boolean;
  showLessLikeThis?: boolean;
  deletedAt?: string;
};

export type Tag = {
  id: string;
  name: string;
  normalizedName: string;
  type: TagType;
  createdAt: string;
  updatedAt: string;
  isUserCreated: boolean;
};

export type Person = {
  id: string;
  displayName: string;
  normalizedName: string;
  relationship?: string;
  notes?: string;
  createdAt: string;
};

export type Pet = {
  id: string;
  name: string;
  species?: string;
  breed?: string;
  approximateStartDate?: string;
  approximateEndDate?: string;
  notes?: string;
};

export type Place = {
  id: string;
  name: string;
  type: "house" | "apartment" | "school" | "workplace" | "town" | "landmark" | "vague_place" | "custom";
  approximateStartDate?: string;
  approximateEndDate?: string;
  latitude?: number;
  longitude?: number;
  privacyLevel: "exact" | "approximate" | "vague" | "hidden";
  notes?: string;
};

export type LifePeriod = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  datePrecision: DatePrecision;
  notes?: string;
};

export type LifeChapterDecision = {
  candidateId: string;
  action: "renamed" | "rejected" | "merged" | "split";
  name?: string;
  targetCandidateId?: string;
  memoryIds?: string[];
  updatedAt: string;
};

export type MemoryTag = {
  memoryId: string;
  tagId: string;
  source: SuggestionSource;
  confidence?: number;
  userConfirmed: boolean;
  rejected: boolean;
  createdAt: string;
};

export type DateCandidate = {
  label: string;
  startDate?: string;
  endDate?: string;
  precision: DatePrecision;
  confidence: number;
  sourceText: string;
  inferenceExplanation?: string;
};

export type TagSuggestion = {
  name: string;
  type: TagType;
  confidence: number;
  source: SuggestionSource;
  explanation?: string;
};

export type ProcessingRunRecord = {
  processorName: string;
  processorVersion: string;
  inputHash: string;
  outputJson: string;
  createdAt: string;
};

export type MemoryEmbeddingRecord = {
  memoryId: string;
  values: number[];
  dimension: number;
  modelId: string;
  modelVersion: string;
  inputHash: string;
  createdAt: string;
};

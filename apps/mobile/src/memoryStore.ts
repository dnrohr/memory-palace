import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import type { MemoryArchive } from "../../../src/core/archive";
import { normalizeTagName, tagsForMemoryArchive } from "../../../src/core/archiveOperations";
import { upsertLifeContextEntity, deleteLifeContextEntity, type LifeContextEntity } from "../../../src/core/lifeContext";
import { initialSchemaSql, schemaVersion } from "../../../src/core/schema";
import { applyMigrations } from "../../../src/storage/migrations";
import type { LifeChapterDecision, LifeContextRelationship, Memory, MemoryEmbeddingRecord, MemoryTag, Tag } from "../../../src/core/types";

const WEB_STORAGE_KEY = "memory-palace.archive.v1";

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export async function loadArchive(): Promise<MemoryArchive> {
  if (Platform.OS === "web") {
    return loadWebArchive();
  }

  const db = await getDatabase();
  const memories = (await db.getAllAsync<MemoryRow>("SELECT * FROM memory ORDER BY created_at DESC")).map(rowToMemory);
  const tags = (await db.getAllAsync<TagRow>("SELECT * FROM tag ORDER BY name ASC")).map(rowToTag);
  const memoryTags = (await db.getAllAsync<MemoryTagRow>("SELECT * FROM memory_tag ORDER BY created_at ASC")).map(rowToMemoryTag);
  const memoryEmbeddings = (await db.getAllAsync<MemoryEmbeddingRow>("SELECT * FROM memory_embedding ORDER BY memory_id ASC")).map(
    rowToMemoryEmbedding
  );
  const lifeChapterDecisions = (
    await db.getAllAsync<LifeChapterDecisionRow>("SELECT * FROM life_chapter_decision ORDER BY updated_at DESC")
  ).map(rowToLifeChapterDecision);
  const lifeContextRelationships = (
    await db.getAllAsync<LifeContextRelationshipRow>("SELECT * FROM life_context_relationship ORDER BY updated_at DESC")
  ).map(rowToLifeContextRelationship);

  return {
    ...createEmptyArchive(),
    memories,
    tags,
    memoryTags,
    memoryEmbeddings,
    lifeContextRelationships,
    lifeChapterDecisions
  };
}

export async function saveArchive(archive: MemoryArchive): Promise<void> {
  if (Platform.OS === "web") {
    await saveWebArchive(archive);
    return;
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM memory_tag");
    await db.runAsync("DELETE FROM memory_embedding");
    await db.runAsync("DELETE FROM life_context_relationship");
    await db.runAsync("DELETE FROM life_chapter_decision");
    await db.runAsync("DELETE FROM tag");
    await db.runAsync("DELETE FROM memory");

    for (const memory of archive.memories) {
      await db.runAsync(
        `INSERT INTO memory (
          id, raw_text, cleaned_text, title, summary, private_notes, created_at, updated_at, captured_at,
          source_type, audio_uri, is_audio_retained, approximate_start_date, approximate_end_date,
          date_precision, date_confidence, date_explanation, user_date_confirmed,
          is_sensitive, exclude_from_resurfacing, show_less_like_this, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          memory.id,
          memory.rawText,
          memory.cleanedText ?? null,
          memory.title ?? null,
          memory.summary ?? null,
          memory.privateNotes ?? null,
          memory.createdAt,
          memory.updatedAt,
          memory.capturedAt ?? null,
          memory.sourceType,
          memory.audioUri ?? null,
          booleanToInteger(memory.isAudioRetained),
          memory.approximateStartDate ?? null,
          memory.approximateEndDate ?? null,
          memory.datePrecision,
          memory.dateConfidence ?? null,
          memory.dateExplanation ?? null,
          booleanToInteger(memory.userDateConfirmed),
          booleanToInteger(Boolean(memory.isSensitive)),
          booleanToInteger(Boolean(memory.excludeFromResurfacing)),
          booleanToInteger(Boolean(memory.showLessLikeThis)),
          memory.deletedAt ?? null
        ]
      );
    }

    for (const tag of archive.tags) {
      await db.runAsync(
        `INSERT INTO tag (
          id, name, normalized_name, type, created_at, updated_at, is_user_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tag.id,
          tag.name,
          tag.normalizedName,
          tag.type,
          tag.createdAt,
          tag.updatedAt,
          booleanToInteger(tag.isUserCreated)
        ]
      );
    }

    for (const link of archive.memoryTags) {
      await db.runAsync(
        `INSERT INTO memory_tag (
          memory_id, tag_id, source, confidence, user_confirmed, rejected, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          link.memoryId,
          link.tagId,
          link.source,
          link.confidence ?? null,
          booleanToInteger(link.userConfirmed),
          booleanToInteger(link.rejected),
          link.createdAt
        ]
      );
    }

    for (const embedding of archive.memoryEmbeddings ?? []) {
      await db.runAsync(
        `INSERT INTO memory_embedding (
          memory_id, vector, dimension, model_id, model_version, created_at, input_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          embedding.memoryId,
          JSON.stringify(embedding.values),
          embedding.dimension,
          embedding.modelId,
          embedding.modelVersion,
          embedding.createdAt,
          embedding.inputHash
        ]
      );
    }

    for (const decision of archive.lifeChapterDecisions ?? []) {
      await db.runAsync(
        `INSERT INTO life_chapter_decision (
          candidate_id, action, name, target_candidate_id, memory_ids_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          decision.candidateId,
          decision.action,
          decision.name ?? null,
          decision.targetCandidateId ?? null,
          decision.memoryIds ? JSON.stringify(decision.memoryIds) : null,
          decision.updatedAt
        ]
      );
    }

    for (const relationship of archive.lifeContextRelationships ?? []) {
      await db.runAsync(
        `INSERT INTO life_context_relationship (
          id, source_kind, source_id, target_kind, target_id, relationship_type,
          label, confidence, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          relationship.id,
          relationship.sourceKind,
          relationship.sourceId,
          relationship.targetKind,
          relationship.targetId,
          relationship.relationshipType,
          relationship.label ?? null,
          relationship.confidence ?? null,
          relationship.source,
          relationship.createdAt,
          relationship.updatedAt
        ]
      );
    }

    await db.runAsync("INSERT INTO memory_fts(memory_fts) VALUES ('rebuild')");
  });
}

export async function clearPlaintextArchiveStorage(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(WEB_STORAGE_KEY);
    return;
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM memory_tag");
    await db.runAsync("DELETE FROM memory_embedding");
    await db.runAsync("DELETE FROM life_context_relationship");
    await db.runAsync("DELETE FROM life_chapter_decision");
    await db.runAsync("DELETE FROM tag");
    await db.runAsync("DELETE FROM memory");
  });
}

export async function searchMemoryIdsWithFts(query: string, limit = 100): Promise<string[] | undefined> {
  const ftsQuery = toFtsQuery(query);
  if (!ftsQuery || Platform.OS === "web") return undefined;

  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT memory.id
     FROM memory_fts
     JOIN memory ON memory_fts.rowid = memory.rowid
     WHERE memory_fts MATCH ? AND memory.deleted_at IS NULL
     ORDER BY bm25(memory_fts)
     LIMIT ?`,
    [ftsQuery, limit]
  );
  return rows.map((row) => row.id);
}

export function createEmptyArchive(): MemoryArchive {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion,
    memories: [],
    tags: [],
    memoryTags: [],
    people: [],
    pets: [],
    places: [],
    lifePeriods: [],
    lifeContextRelationships: [],
    lifeChapterDecisions: [],
    memoryEmbeddings: [],
    processingRuns: []
  };
}

export function upsertMemory(archive: MemoryArchive, memory: Memory): MemoryArchive {
  const existing = archive.memories.findIndex((item) => item.id === memory.id);
  const memories = [...archive.memories];

  if (existing >= 0) {
    memories[existing] = memory;
  } else {
    memories.unshift(memory);
  }

  return { ...archive, memories };
}

export function replaceTags(archive: MemoryArchive, memoryId: string, tagNames: string[]): MemoryArchive {
  const now = new Date().toISOString();
  const uniqueNames = [...new Set(tagNames.map((tag) => tag.trim()).filter(Boolean))];
  const existingTags = new Map(archive.tags.map((tag) => [tag.normalizedName, tag]));
  const tags = [...archive.tags];
  const links: MemoryTag[] = archive.memoryTags.filter((link) => link.memoryId !== memoryId);

  for (const name of uniqueNames) {
    const normalizedName = normalizeTagName(name);
    let tag = existingTags.get(normalizedName);

    if (!tag) {
      tag = {
        id: createId("tag"),
        name,
        normalizedName,
        type: "custom",
        createdAt: now,
        updatedAt: now,
        isUserCreated: true
      };
      existingTags.set(normalizedName, tag);
      tags.push(tag);
    }

    links.push({
      memoryId,
      tagId: tag.id,
      source: "explicit",
      userConfirmed: true,
      rejected: false,
      createdAt: now
    });
  }

  return { ...archive, tags, memoryTags: links };
}

export function createMemory(rawText: string, title?: string): Memory {
  const now = new Date().toISOString();
  const trimmed = rawText.trim();

  return {
    id: createId("mem"),
    rawText: trimmed,
    cleanedText: trimmed,
    title: title?.trim() || deriveTitle(trimmed),
    createdAt: now,
    updatedAt: now,
    sourceType: "typed",
    isAudioRetained: false,
    datePrecision: "unknown",
    userDateConfirmed: false
  };
}

export function softDeleteMemory(archive: MemoryArchive, memoryId: string): MemoryArchive {
  const now = new Date().toISOString();
  return {
    ...archive,
    memories: archive.memories.map((memory) =>
      memory.id === memoryId ? { ...memory, deletedAt: now, updatedAt: now } : memory
    )
  };
}

export function tagsForMemory(archive: MemoryArchive, memoryId: string): Tag[] {
  return tagsForMemoryArchive(archive, memoryId);
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertLifeContext(archive: MemoryArchive, entity: LifeContextEntity): MemoryArchive {
  return {
    ...archive,
    ...upsertLifeContextEntity(archive, entity)
  };
}

export function deleteLifeContext(
  archive: MemoryArchive,
  kind: LifeContextEntity["kind"],
  id: string
): MemoryArchive {
  return {
    ...archive,
    ...deleteLifeContextEntity(archive, kind, id)
  };
}

function deriveTitle(text: string): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return "Untitled memory";
  return firstSentence.length > 64 ? `${firstSentence.slice(0, 61)}...` : firstSentence;
}

function toFtsQuery(query: string): string | undefined {
  const terms = query
    .toLocaleLowerCase()
    .match(/[a-z0-9]+/g)
    ?.slice(0, 8);
  if (!terms || terms.length === 0) return undefined;
  return terms.map((term) => `${term}*`).join(" ");
}

async function loadWebArchive(): Promise<MemoryArchive> {
  const raw = await AsyncStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return createEmptyArchive();

  const parsed = JSON.parse(raw) as MemoryArchive;
  return {
    ...createEmptyArchive(),
    ...parsed,
    memories: parsed.memories ?? [],
    tags: parsed.tags ?? [],
    memoryTags: parsed.memoryTags ?? [],
    lifeChapterDecisions: parsed.lifeChapterDecisions ?? [],
    lifeContextRelationships: parsed.lifeContextRelationships ?? [],
    memoryEmbeddings: parsed.memoryEmbeddings ?? [],
    processingRuns: parsed.processingRuns ?? []
  };
}

async function saveWebArchive(archive: MemoryArchive): Promise<void> {
  await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ ...archive, exportedAt: new Date().toISOString() }));
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("memory-palace.db");
  await applyMigrations(db);
  return db;
}

function booleanToInteger(value: boolean): number {
  return value ? 1 : 0;
}

function integerToBoolean(value: number): boolean {
  return value === 1;
}

type MemoryRow = {
  id: string;
  raw_text: string;
  cleaned_text: string | null;
  title: string | null;
  summary: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
  captured_at: string | null;
  source_type: Memory["sourceType"];
  audio_uri: string | null;
  is_audio_retained: number;
  approximate_start_date: string | null;
  approximate_end_date: string | null;
  date_precision: Memory["datePrecision"];
  date_confidence: number | null;
  date_explanation: string | null;
  user_date_confirmed: number;
  is_sensitive: number;
  exclude_from_resurfacing: number;
  show_less_like_this: number;
  deleted_at: string | null;
};

type TagRow = {
  id: string;
  name: string;
  normalized_name: string;
  type: Tag["type"];
  created_at: string;
  updated_at: string;
  is_user_created: number;
};

type MemoryTagRow = {
  memory_id: string;
  tag_id: string;
  source: MemoryTag["source"];
  confidence: number | null;
  user_confirmed: number;
  rejected: number;
  created_at: string;
};

type MemoryEmbeddingRow = {
  memory_id: string;
  vector: string;
  dimension: number;
  model_id: string;
  model_version: string;
  input_hash: string | null;
  created_at: string;
};

type LifeChapterDecisionRow = {
  candidate_id: string;
  action: LifeChapterDecision["action"];
  name: string | null;
  target_candidate_id: string | null;
  memory_ids_json: string | null;
  updated_at: string;
};

type LifeContextRelationshipRow = {
  id: string;
  source_kind: LifeContextRelationship["sourceKind"];
  source_id: string;
  target_kind: LifeContextRelationship["targetKind"];
  target_id: string;
  relationship_type: LifeContextRelationship["relationshipType"];
  label: string | null;
  confidence: number | null;
  source: LifeContextRelationship["source"];
  created_at: string;
  updated_at: string;
};

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    rawText: row.raw_text,
    ...(row.cleaned_text ? { cleanedText: row.cleaned_text } : {}),
    ...(row.title ? { title: row.title } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
    ...(row.private_notes ? { privateNotes: row.private_notes } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.captured_at ? { capturedAt: row.captured_at } : {}),
    sourceType: row.source_type,
    ...(row.audio_uri ? { audioUri: row.audio_uri } : {}),
    isAudioRetained: integerToBoolean(row.is_audio_retained),
    ...(row.approximate_start_date ? { approximateStartDate: row.approximate_start_date } : {}),
    ...(row.approximate_end_date ? { approximateEndDate: row.approximate_end_date } : {}),
    datePrecision: row.date_precision,
    ...(row.date_confidence !== null ? { dateConfidence: row.date_confidence } : {}),
    ...(row.date_explanation ? { dateExplanation: row.date_explanation } : {}),
    userDateConfirmed: integerToBoolean(row.user_date_confirmed),
    isSensitive: integerToBoolean(row.is_sensitive),
    excludeFromResurfacing: integerToBoolean(row.exclude_from_resurfacing),
    showLessLikeThis: integerToBoolean(row.show_less_like_this),
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {})
  };
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isUserCreated: integerToBoolean(row.is_user_created)
  };
}

function rowToMemoryTag(row: MemoryTagRow): MemoryTag {
  return {
    memoryId: row.memory_id,
    tagId: row.tag_id,
    source: row.source,
    ...(row.confidence !== null ? { confidence: row.confidence } : {}),
    userConfirmed: integerToBoolean(row.user_confirmed),
    rejected: integerToBoolean(row.rejected),
    createdAt: row.created_at
  };
}

function rowToMemoryEmbedding(row: MemoryEmbeddingRow): MemoryEmbeddingRecord {
  return {
    memoryId: row.memory_id,
    values: JSON.parse(row.vector) as number[],
    dimension: row.dimension,
    modelId: row.model_id,
    modelVersion: row.model_version,
    inputHash: row.input_hash ?? "",
    createdAt: row.created_at
  };
}

function rowToLifeChapterDecision(row: LifeChapterDecisionRow): LifeChapterDecision {
  return {
    candidateId: row.candidate_id,
    action: row.action,
    ...(row.name ? { name: row.name } : {}),
    ...(row.target_candidate_id ? { targetCandidateId: row.target_candidate_id } : {}),
    ...(row.memory_ids_json ? { memoryIds: JSON.parse(row.memory_ids_json) as string[] } : {}),
    updatedAt: row.updated_at
  };
}

function rowToLifeContextRelationship(row: LifeContextRelationshipRow): LifeContextRelationship {
  return {
    id: row.id,
    sourceKind: row.source_kind,
    sourceId: row.source_id,
    targetKind: row.target_kind,
    targetId: row.target_id,
    relationshipType: row.relationship_type,
    ...(row.label ? { label: row.label } : {}),
    ...(row.confidence !== null ? { confidence: row.confidence } : {}),
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

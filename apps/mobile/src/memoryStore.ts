import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { MemoryArchive } from "../../../src/core/archive";
import { initialSchemaSql, schemaVersion } from "../../../src/core/schema";
import type { Memory, MemoryTag, Tag } from "../../../src/core/types";

const WEB_STORAGE_KEY = "memory-palace.archive.v1";

let databasePromise: Promise<import("expo-sqlite").SQLiteDatabase> | undefined;

export async function loadArchive(): Promise<MemoryArchive> {
  if (Platform.OS === "web") {
    return loadWebArchive();
  }

  const db = await getDatabase();
  const memories = (await db.getAllAsync<MemoryRow>("SELECT * FROM memory ORDER BY created_at DESC")).map(rowToMemory);
  const tags = (await db.getAllAsync<TagRow>("SELECT * FROM tag ORDER BY name ASC")).map(rowToTag);
  const memoryTags = (await db.getAllAsync<MemoryTagRow>("SELECT * FROM memory_tag ORDER BY created_at ASC")).map(rowToMemoryTag);

  return {
    ...createEmptyArchive(),
    memories,
    tags,
    memoryTags
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
    await db.runAsync("DELETE FROM tag");
    await db.runAsync("DELETE FROM memory");

    for (const memory of archive.memories) {
      await db.runAsync(
        `INSERT INTO memory (
          id, raw_text, cleaned_text, title, summary, created_at, updated_at, captured_at,
          source_type, audio_uri, is_audio_retained, approximate_start_date, approximate_end_date,
          date_precision, date_confidence, date_explanation, user_date_confirmed, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          memory.id,
          memory.rawText,
          memory.cleanedText ?? null,
          memory.title ?? null,
          memory.summary ?? null,
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
  });
}

export function createEmptyArchive(): MemoryArchive {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion,
    memories: [],
    tags: [],
    memoryTags: [],
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
  const tagsById = new Map(archive.tags.map((tag) => [tag.id, tag]));
  return archive.memoryTags
    .filter((link) => link.memoryId === memoryId && !link.rejected)
    .map((link) => tagsById.get(link.tagId))
    .filter((tag): tag is Tag => Boolean(tag))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTagName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function deriveTitle(text: string): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return "Untitled memory";
  return firstSentence.length > 64 ? `${firstSentence.slice(0, 61)}...` : firstSentence;
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
    processingRuns: parsed.processingRuns ?? []
  };
}

async function saveWebArchive(archive: MemoryArchive): Promise<void> {
  await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ ...archive, exportedAt: new Date().toISOString() }));
}

async function getDatabase(): Promise<import("expo-sqlite").SQLiteDatabase> {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function openDatabase(): Promise<import("expo-sqlite").SQLiteDatabase> {
  const SQLite = await import("expo-sqlite");
  const db = await SQLite.openDatabaseAsync("memory-palace.db");
  await db.execAsync(initialSchemaSql);
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

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    rawText: row.raw_text,
    ...(row.cleaned_text ? { cleanedText: row.cleaned_text } : {}),
    ...(row.title ? { title: row.title } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
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

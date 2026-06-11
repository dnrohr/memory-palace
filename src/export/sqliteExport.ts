import type { MemoryArchive } from "../core/archive";
import { initialSchemaSql } from "../core/schema";
import type { ExportArtifact, IExportProvider } from "./contracts";

export class SqliteExportProvider implements IExportProvider {
  async exportArchive(archive: MemoryArchive): Promise<ExportArtifact[]> {
    return [
      {
        fileName: "memory-palace-export.sql",
        mediaType: "application/sql",
        content: renderSqliteDump(archive)
      }
    ];
  }
}

export function renderSqliteDump(archive: MemoryArchive): string {
  const statements = [
    "PRAGMA foreign_keys=OFF;",
    "BEGIN TRANSACTION;",
    initialSchemaSql.trim(),
    ...archive.memories.map((memory) =>
      insertStatement("memory", {
        id: memory.id,
        raw_text: memory.rawText,
        cleaned_text: memory.cleanedText,
        title: memory.title,
        summary: memory.summary,
        created_at: memory.createdAt,
        updated_at: memory.updatedAt,
        captured_at: memory.capturedAt,
        source_type: memory.sourceType,
        audio_uri: memory.audioUri,
        is_audio_retained: memory.isAudioRetained ? 1 : 0,
        approximate_start_date: memory.approximateStartDate,
        approximate_end_date: memory.approximateEndDate,
        date_precision: memory.datePrecision,
        date_confidence: memory.dateConfidence,
        date_explanation: memory.dateExplanation,
        user_date_confirmed: memory.userDateConfirmed ? 1 : 0,
        deleted_at: memory.deletedAt
      })
    ),
    ...archive.tags.map((tag) =>
      insertStatement("tag", {
        id: tag.id,
        name: tag.name,
        normalized_name: tag.normalizedName,
        type: tag.type,
        created_at: tag.createdAt,
        updated_at: tag.updatedAt,
        is_user_created: tag.isUserCreated ? 1 : 0
      })
    ),
    ...archive.memoryTags.map((link) =>
      insertStatement("memory_tag", {
        memory_id: link.memoryId,
        tag_id: link.tagId,
        source: link.source,
        confidence: link.confidence,
        user_confirmed: link.userConfirmed ? 1 : 0,
        rejected: link.rejected ? 1 : 0,
        created_at: link.createdAt
      })
    ),
    ...archive.lifePeriods.map((period) =>
      insertStatement("life_period", {
        id: period.id,
        name: period.name,
        start_date: period.startDate,
        end_date: period.endDate,
        date_precision: period.datePrecision,
        notes: period.notes
      })
    ),
    ...(archive.lifeChapterDecisions ?? []).map((decision) =>
      insertStatement("life_chapter_decision", {
        candidate_id: decision.candidateId,
        action: decision.action,
        name: decision.name,
        updated_at: decision.updatedAt
      })
    ),
    "INSERT INTO memory_fts(memory_fts) VALUES ('rebuild');",
    "COMMIT;",
    "PRAGMA foreign_keys=ON;"
  ];

  return `${statements.join("\n")}\n`;
}

function insertStatement(table: string, values: Record<string, string | number | undefined>): string {
  const entries = Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined);
  const columns = entries.map(([key]) => quoteIdentifier(key)).join(", ");
  const sqlValues = entries.map(([, value]) => sqlValue(value)).join(", ");
  return `INSERT INTO ${quoteIdentifier(table)} (${columns}) VALUES (${sqlValues});`;
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sqlValue(value: string | number): string {
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

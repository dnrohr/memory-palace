import { initialSchemaSql, schemaVersion } from "../core/schema";

export type Migration = {
  id: string;
  version: string;
  sql: string;
};

export type MigrationBindValue = string | number | boolean | null | Uint8Array;

export const migrations: Migration[] = [
  {
    id: "0001_initial_schema",
    version: schemaVersion,
    sql: initialSchemaSql
  },
  {
    id: "0002_embedding_input_hash",
    version: schemaVersion,
    sql: `
ALTER TABLE memory_embedding ADD COLUMN input_hash TEXT;
`
  },
  {
    id: "0003_life_chapter_decisions",
    version: schemaVersion,
    sql: `
CREATE TABLE IF NOT EXISTS life_chapter_decision (
  candidate_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  name TEXT,
  updated_at TEXT NOT NULL
);
`
  },
  {
    id: "0004_life_chapter_merge_split",
    version: schemaVersion,
    sql: `
ALTER TABLE life_chapter_decision ADD COLUMN target_candidate_id TEXT;
ALTER TABLE life_chapter_decision ADD COLUMN memory_ids_json TEXT;
`
  },
  {
    id: "0005_memory_safety_controls",
    version: schemaVersion,
    sql: `
ALTER TABLE memory ADD COLUMN is_sensitive INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memory ADD COLUMN exclude_from_resurfacing INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memory ADD COLUMN show_less_like_this INTEGER NOT NULL DEFAULT 0;
`
  },
  {
    id: "0006_memory_private_notes",
    version: schemaVersion,
    sql: `
ALTER TABLE memory ADD COLUMN private_notes TEXT;
`
  },
  {
    id: "0007_life_context_relationships",
    version: schemaVersion,
    sql: `
CREATE TABLE IF NOT EXISTS life_context_relationship (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  label TEXT,
  confidence REAL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`
  }
];

export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, params: MigrationBindValue[]): Promise<unknown>;
}

export async function applyMigrations(db: MigrationDatabase, now = new Date().toISOString()): Promise<string[]> {
  await db.execAsync(`
CREATE TABLE IF NOT EXISTS schema_migration (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`);

  const applied = await db.getAllAsync<{ id: string }>("SELECT id FROM schema_migration");
  const appliedIds = new Set(applied.map((row) => row.id));
  const appliedNow: string[] = [];

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;
    await db.execAsync(migration.sql);
    await db.runAsync("INSERT INTO schema_migration (id, version, applied_at) VALUES (?, ?, ?)", [
      migration.id,
      migration.version,
      now
    ]);
    appliedNow.push(migration.id);
  }

  return appliedNow;
}

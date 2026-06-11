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

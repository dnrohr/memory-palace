import { describe, expect, it } from "vitest";
import { applyMigrations, type MigrationDatabase } from "../src/storage/migrations";

class FakeMigrationDatabase implements MigrationDatabase {
  applied = new Set<string>();
  execStatements: string[] = [];
  tableColumns = new Map<string, Set<string>>();

  async execAsync(sql: string): Promise<void> {
    this.execStatements.push(sql);
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const tableInfoMatch = sql.match(/^PRAGMA table_info\(([^)]+)\)/);
    if (tableInfoMatch) {
      const tableName = tableInfoMatch[1] ?? "";
      return [...(this.tableColumns.get(tableName) ?? [])].map((name) => ({ name }) as T);
    }
    return [...this.applied].map((id) => ({ id }) as T);
  }

  async runAsync(_sql: string, params?: unknown[]): Promise<unknown> {
    if (typeof params?.[0] === "string") {
      this.applied.add(params[0]);
    }
    return undefined;
  }
}

describe("storage migrations", () => {
  it("applies unapplied migrations once", async () => {
    const db = new FakeMigrationDatabase();

    await expect(applyMigrations(db, "2026-06-11T00:00:00.000Z")).resolves.toEqual([
      "0001_initial_schema",
      "0002_embedding_input_hash",
      "0003_life_chapter_decisions",
      "0004_life_chapter_merge_split",
      "0005_memory_safety_controls",
      "0006_memory_private_notes",
      "0007_life_context_relationships",
      "0008_user_profile_school_calendar"
    ]);
    await expect(applyMigrations(db, "2026-06-11T00:00:00.000Z")).resolves.toEqual([]);
  });

  it("skips additive column migrations when the latest schema already has those columns", async () => {
    const db = new FakeMigrationDatabase();
    db.tableColumns.set("memory_embedding", new Set(["input_hash"]));
    db.tableColumns.set("life_chapter_decision", new Set(["target_candidate_id", "memory_ids_json"]));
    db.tableColumns.set(
      "memory",
      new Set(["is_sensitive", "exclude_from_resurfacing", "show_less_like_this", "private_notes"])
    );
    db.tableColumns.set("user_profile", new Set(["school_year_start_month", "kindergarten_start_age"]));

    await applyMigrations(db, "2026-06-11T00:00:00.000Z");

    expect(db.execStatements).not.toContain("ALTER TABLE memory_embedding ADD COLUMN input_hash TEXT;");
    expect(db.execStatements).not.toContain("ALTER TABLE life_chapter_decision ADD COLUMN target_candidate_id TEXT;");
    expect(db.execStatements).not.toContain("ALTER TABLE life_chapter_decision ADD COLUMN memory_ids_json TEXT;");
    expect(db.execStatements).not.toContain("ALTER TABLE memory ADD COLUMN is_sensitive INTEGER NOT NULL DEFAULT 0;");
    expect(db.execStatements).not.toContain(
      "ALTER TABLE memory ADD COLUMN exclude_from_resurfacing INTEGER NOT NULL DEFAULT 0;"
    );
    expect(db.execStatements).not.toContain("ALTER TABLE memory ADD COLUMN show_less_like_this INTEGER NOT NULL DEFAULT 0;");
    expect(db.execStatements).not.toContain("ALTER TABLE memory ADD COLUMN private_notes TEXT;");
    expect(db.execStatements).not.toContain("ALTER TABLE user_profile ADD COLUMN school_year_start_month INTEGER;");
    expect(db.execStatements).not.toContain("ALTER TABLE user_profile ADD COLUMN kindergarten_start_age INTEGER;");
  });
});

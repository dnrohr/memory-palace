import { describe, expect, it } from "vitest";
import { applyMigrations, type MigrationDatabase } from "../src/storage/migrations";

class FakeMigrationDatabase implements MigrationDatabase {
  applied = new Set<string>();
  execStatements: string[] = [];

  async execAsync(sql: string): Promise<void> {
    this.execStatements.push(sql);
  }

  async getAllAsync<T>(): Promise<T[]> {
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

    await expect(applyMigrations(db, "2026-06-11T00:00:00.000Z")).resolves.toEqual(["0001_initial_schema"]);
    await expect(applyMigrations(db, "2026-06-11T00:00:00.000Z")).resolves.toEqual([]);
  });
});


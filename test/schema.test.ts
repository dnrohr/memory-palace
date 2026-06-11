import { describe, expect, it } from "vitest";
import { initialSchemaSql, schemaVersion } from "../src/core/schema";

describe("schema", () => {
  it("tracks the schema version", () => {
    expect(schemaVersion).toBe("0.1.0");
  });

  it("includes the MVP canonical tables and FTS index", () => {
    expect(initialSchemaSql).toContain("CREATE TABLE IF NOT EXISTS memory");
    expect(initialSchemaSql).toContain("CREATE TABLE IF NOT EXISTS tag");
    expect(initialSchemaSql).toContain("CREATE TABLE IF NOT EXISTS memory_tag");
    expect(initialSchemaSql).toContain("CREATE TABLE IF NOT EXISTS user_profile");
    expect(initialSchemaSql).toContain("CREATE TABLE IF NOT EXISTS processing_run");
    expect(initialSchemaSql).toContain("CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5");
  });
});

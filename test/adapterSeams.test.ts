import { describe, expect, it } from "vitest";
import { HashEmbeddingEngine, NoEmbeddingEngine } from "../src/processing/embeddings";
import {
  NoStructuredExtractionEngine,
  RulesStructuredExtractionEngine,
  validateStructuredExtractionResult
} from "../src/processing/structuredExtraction";

describe("optional AI adapter seams", () => {
  it("keeps structured extraction optional", async () => {
    const result = await new NoStructuredExtractionEngine().extract({ text: "A memory." });

    expect(result).toEqual({
      dates: [],
      tags: [],
      emotionalTone: [],
      engineId: "none",
      engineVersion: "0.1.0",
      schemaVersion: "structured-extraction.v1"
    });
  });

  it("keeps embeddings optional", async () => {
    const engine = new NoEmbeddingEngine();

    await expect(engine.embedText("A memory.")).resolves.toBeUndefined();
    await expect(engine.embedBatch(["one", "two"])).resolves.toEqual([undefined, undefined]);
  });

  it("provides a local hash embedding engine", async () => {
    const vector = await new HashEmbeddingEngine(16).embedText("dog window");

    expect(vector.values).toHaveLength(16);
    expect(vector.modelId).toBe("hash-embedding");
  });

  it("provides a local rules-backed structured extraction engine", async () => {
    const result = await new RulesStructuredExtractionEngine().extract({
      text: "In 2004 my dog Patrick died, but I loved him."
    });

    expect(result.title).toBe("In 2004 my dog Patrick died, but I loved him");
    expect(result.promptVersion).toBe("rules.v1");
    expect(validateStructuredExtractionResult(result)).toEqual({ valid: true, warnings: [] });
    expect(result.dates).toEqual([expect.objectContaining({ label: "2004" })]);
    expect(result.tags).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Patrick" })]));
    expect(result.emotionalTone).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "grief" }), expect.objectContaining({ name: "joy" })])
    );
  });

  it("validates structured extraction result confidence ranges", () => {
    expect(
      validateStructuredExtractionResult({
        dates: [],
        tags: [{ name: "impossible", type: "theme", confidence: 1.5, source: "model" }],
        emotionalTone: [],
        engineId: "model",
        engineVersion: "0.1.0",
        schemaVersion: "structured-extraction.v1"
      })
    ).toEqual({
      valid: false,
      warnings: ['Tag suggestion "impossible" has invalid confidence.']
    });
  });
});

import { describe, expect, it } from "vitest";
import { embedSearchQuery, HashEmbeddingEngine, LocalModelEmbeddingEngine, NoEmbeddingEngine } from "../src/processing/embeddings";
import {
  BGE_SMALL_EN_V15_MODEL,
  createBgeSmallEnV15EmbeddingEngine,
  meanPoolTokenEmbeddings,
  toQueryInput
} from "../src/processing/bgeEmbeddings";
import {
  buildStructuredExtractionPrompt,
  JsonLocalModelStructuredExtractionEngine,
  NoStructuredExtractionEngine,
  RulesStructuredExtractionEngine,
  validateStructuredExtractionResult
} from "../src/processing/structuredExtraction";
import {
  buildQwenStructuredExtractionPrompt,
  createQwenStructuredExtractionEngine,
  QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL,
  type LlamaCompletionRequest
} from "../src/processing/qwenStructuredExtraction";

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

  it("wraps a local embedding model runtime", async () => {
    const engine = new LocalModelEmbeddingEngine({
      id: "fixture",
      displayName: "Fixture embedding model",
      version: "1.0.0",
      dimension: 3,
      async embed(text) {
        return text.includes("dog") ? [3, 4, 0] : [0, 0, 2];
      },
      async embedBatch(texts) {
        return texts.map((text) => (text.includes("dog") ? [3, 4, 0] : [0, 0, 2]));
      }
    });

    const vector = await engine.embedText("dog window");
    const batch = await engine.embedBatch(["dog", "window"]);

    expect(vector).toEqual({
      values: [0.6, 0.8, 0],
      modelId: "local-model-embedding-fixture",
      modelVersion: "1.0.0"
    });
    expect(batch).toHaveLength(2);
    expect(batch[1]?.values).toEqual([0, 0, 1]);
  });

  it("rejects local embedding model vectors with the wrong dimension", async () => {
    const engine = new LocalModelEmbeddingEngine({
      id: "bad-fixture",
      displayName: "Bad embedding model",
      version: "1.0.0",
      dimension: 3,
      async embed() {
        return [1, 2];
      }
    });

    await expect(engine.embedText("memory")).rejects.toThrow("expected 3");
  });

  it("defines BGE small English v1.5 as the production embedding target", () => {
    expect(BGE_SMALL_EN_V15_MODEL).toEqual(
      expect.objectContaining({
        id: "bge-small-en-v1.5",
        dimension: 384,
        runtime: "onnxruntime-react-native",
        provider: "BAAI"
      })
    );
    expect(toQueryInput("old bedroom")).toBe("Represent this sentence for searching relevant passages: old bedroom");
  });

  it("mean-pools BGE ONNX token embeddings with an attention mask", () => {
    const dimension = BGE_SMALL_EN_V15_MODEL.dimension;
    const tokenA = Array.from({ length: dimension }, (_, index) => index + 1);
    const tokenB = Array.from({ length: dimension }, (_, index) => (index + 1) * 3);
    const padding = Array.from({ length: dimension }, () => 999);
    const pooled = meanPoolTokenEmbeddings(
      {
        dims: [1, 3, dimension],
        data: [...tokenA, ...tokenB, ...padding]
      },
      [[1, 1, 0]]
    );

    expect(pooled).toHaveLength(1);
    expect(pooled[0]?.slice(0, 4)).toEqual([2, 4, 6, 8]);
  });

  it("wraps a BGE ONNX runtime and uses the query prefix only for search queries", async () => {
    const seenTexts: string[][] = [];
    const engine = createBgeSmallEnV15EmbeddingEngine({
      tokenizer: {
        async tokenize(texts) {
          seenTexts.push(texts);
          return {
            inputIds: texts.map(() => [1, 2]),
            attentionMask: texts.map(() => [1, 1])
          };
        }
      },
      session: {
        async run() {
          const dimension = BGE_SMALL_EN_V15_MODEL.dimension;
          return {
            last_hidden_state: {
              dims: [1, 2, dimension],
              data: [
                ...Array.from({ length: dimension }, () => 3),
                ...Array.from({ length: dimension }, () => 4)
              ]
            }
          };
        }
      }
    });

    const passageVector = await engine.embedText("my old bedroom");
    const queryVector = await embedSearchQuery(engine, "old bedroom");

    expect(engine.id).toBe("local-model-embedding-bge-small-en-v1.5");
    expect(passageVector.values).toHaveLength(384);
    expect(queryVector?.values).toHaveLength(384);
    expect(seenTexts).toEqual([["my old bedroom"], [toQueryInput("old bedroom")]]);
    expect(passageVector.values[0]).toBeCloseTo(1 / Math.sqrt(384));
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

  it("wraps a JSON-speaking local structured extraction model", async () => {
    let prompt = "";
    const engine = new JsonLocalModelStructuredExtractionEngine({
      id: "fixture",
      displayName: "Fixture local model",
      version: "1.0.0",
      async complete(input) {
        prompt = input;
        return `\`\`\`json
{
  "title": "Patrick in the window",
  "dates": [{ "label": "2004", "precision": "year", "confidence": 0.8, "source": "model" }],
  "tags": [{ "name": "Patrick", "type": "pet", "confidence": 0.9, "source": "model" }],
  "emotionalTone": []
}
\`\`\``;
      }
    });

    const result = await engine.extract({ text: "In 2004 Patrick slept in the window." });

    expect(prompt).toContain("Return only JSON");
    expect(result).toEqual(
      expect.objectContaining({
        title: "Patrick in the window",
        engineId: "local-model-structured-fixture",
        engineVersion: "1.0.0",
        promptVersion: "local-model-json.v1"
      })
    );
    expect(validateStructuredExtractionResult(result)).toEqual({ valid: true, warnings: [] });
  });

  it("rejects invalid local model structured extraction output", async () => {
    const engine = new JsonLocalModelStructuredExtractionEngine({
      id: "bad-fixture",
      displayName: "Bad fixture",
      version: "1.0.0",
      async complete() {
        return JSON.stringify({
          dates: [],
          tags: [{ name: "too much", type: "theme", confidence: 2, source: "model" }],
          emotionalTone: []
        });
      }
    });

    await expect(engine.extract({ text: "A memory." })).rejects.toThrow("invalid output");
  });

  it("builds local structured extraction prompts with known context", () => {
    expect(
      buildStructuredExtractionPrompt({
        text: "Patrick slept in the old house.",
        context: {
          people: [],
          pets: [{ id: "pet-1", name: "Patrick" }],
          places: [{ id: "place-1", name: "old house", type: "house", privacyLevel: "vague" }],
          lifePeriods: []
        }
      })
    ).toContain("Known pets: Patrick");
  });

  it("defines Qwen2.5 0.5B Instruct as the structured extraction target", () => {
    expect(QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL).toEqual(
      expect.objectContaining({
        id: "qwen2.5-0.5b-instruct",
        runtime: "llama.rn",
        recommendedQuantization: "Q4_K_M"
      })
    );
    expect(buildQwenStructuredExtractionPrompt({ text: "A memory." })).toContain("<|im_start|>system");
  });

  it("wraps a llama runtime for deterministic Qwen JSON extraction", async () => {
    let request: LlamaCompletionRequest | undefined;
    const engine = createQwenStructuredExtractionEngine({
      grammar: "root ::= object",
      runtime: {
        async complete(input) {
          request = input;
          return JSON.stringify({
            title: "Grandma in Queens",
            dates: [],
            tags: [{ name: "Grandma", type: "person", confidence: 0.82, source: "model" }],
            emotionalTone: []
          });
        }
      }
    });

    const result = await engine.extract({ text: "I remember visiting Grandma in Queens." });

    expect(request).toEqual(
      expect.objectContaining({
        temperature: 0,
        maxTokens: 700,
        grammar: "root ::= object"
      })
    );
    expect(request?.prompt).toContain("Return strict JSON only");
    expect(result).toEqual(
      expect.objectContaining({
        title: "Grandma in Queens",
        engineId: "local-model-structured-qwen2.5-0.5b-instruct",
        engineVersion: "2.5",
        promptVersion: "local-model-json.v1"
      })
    );
    expect(validateStructuredExtractionResult(result)).toEqual({ valid: true, warnings: [] });
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

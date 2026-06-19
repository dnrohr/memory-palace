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
  mergeStructuredExtractionResults,
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
import {
  buildQwenTranscriptFormattingPrompt,
  cleanQwenTranscriptFormattingOutput,
  createQwenTranscriptFormatter,
  QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL
} from "../src/processing/qwenTranscriptFormatting";
import { createQwenLlamaCompletionRuntime, type LlamaCompletionContext } from "../src/processing/qwenLlamaRuntime";
import {
  BGE_SMALL_EN_V15_ASSET_MANIFEST,
  checkLocalModelAvailability,
  createBgeEmbeddingEngineFromAssets,
  createQwenStructuredExtractionEngineFromAssets,
  createQwenTranscriptFormatterFromAssets,
  findLocalModelAssetByFileName,
  QWEN_2_5_0_5B_ASSET_MANIFEST,
  type ILocalModelAssetStore,
  type LocalModelAsset
} from "../src/processing/localModelAssets";
import { createTransformersJsBgeTokenizer } from "../src/processing/transformersBgeTokenizer";
import { createWordPieceBgeTokenizerFromTokenizerJson } from "../src/processing/wordPieceBgeTokenizer";

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

  it("checks required local model assets without requiring bundled weights", async () => {
    const store = assetStoreWith(["model.onnx"]);

    const availability = await checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, store);

    expect(availability.available).toBe(false);
    expect(availability.assets.map((asset) => asset.fileName)).toEqual(["model.onnx"]);
    expect(availability.missingAssetIds).toEqual(["tokenizer-json", "tokenizer-config"]);
  });

  it("marks wrong-size local model assets unavailable", async () => {
    const store = assetStoreWith(["model.onnx", "tokenizer.json", "tokenizer_config.json"], { "model.onnx": 12 });

    const availability = await checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, store);

    expect(availability.available).toBe(false);
    expect(availability.missingAssetIds).toEqual([]);
    expect(availability.invalidAssetIds).toEqual(["onnx-model"]);
    expect(availability.assetProblems).toEqual([
      expect.objectContaining({
        assetId: "onnx-model",
        fileName: "model.onnx",
        problem: expect.stringContaining("Expected")
      })
    ]);
  });

  it("rejects wrong-size Qwen files before loading the runtime", async () => {
    let runtimeLoaded = false;

    const engine = await createQwenStructuredExtractionEngineFromAssets(
      assetStoreWith(["qwen2.5-0.5b-instruct-q4_k_m.gguf"], { "qwen2.5-0.5b-instruct-q4_k_m.gguf": 12 }),
      async () => {
        runtimeLoaded = true;
        throw new Error("Runtime should not load when required assets are invalid.");
      }
    );
    const availability = await checkLocalModelAvailability(
      QWEN_2_5_0_5B_ASSET_MANIFEST,
      assetStoreWith(["qwen2.5-0.5b-instruct-q4_k_m.gguf"], { "qwen2.5-0.5b-instruct-q4_k_m.gguf": 12 })
    );

    expect(engine).toBeUndefined();
    expect(runtimeLoaded).toBe(false);
    expect(availability.available).toBe(false);
    expect(availability.invalidAssetIds).toEqual(["gguf-model"]);
  });

  it("matches selected model files back to their manifest entries", () => {
    expect(findLocalModelAssetByFileName([BGE_SMALL_EN_V15_ASSET_MANIFEST, QWEN_2_5_0_5B_ASSET_MANIFEST], "MODEL.ONNX")).toEqual(
      expect.objectContaining({
        manifest: expect.objectContaining({ id: "bge-small-en-v1.5" }),
        asset: expect.objectContaining({ id: "onnx-model" })
      })
    );
    expect(findLocalModelAssetByFileName([BGE_SMALL_EN_V15_ASSET_MANIFEST], "notes.txt")).toBeUndefined();
  });

  it("maps selected Qwen and BGE import filenames to separate manifests", () => {
    const manifests = [BGE_SMALL_EN_V15_ASSET_MANIFEST, QWEN_2_5_0_5B_ASSET_MANIFEST];
    const mapped = ["model.onnx", "tokenizer.json", "qwen2.5-0.5b-instruct-q4_k_m.gguf", "STRUCTURED-EXTRACTION.GBNF"].map(
      (fileName) => findLocalModelAssetByFileName(manifests, fileName)
    );

    expect(mapped).toEqual([
      expect.objectContaining({
        manifest: expect.objectContaining({ id: "bge-small-en-v1.5" }),
        asset: expect.objectContaining({ id: "onnx-model" })
      }),
      expect.objectContaining({
        manifest: expect.objectContaining({ id: "bge-small-en-v1.5" }),
        asset: expect.objectContaining({ id: "tokenizer-json" })
      }),
      expect.objectContaining({
        manifest: expect.objectContaining({ id: "qwen2.5-0.5b-instruct" }),
        asset: expect.objectContaining({ id: "gguf-model" })
      }),
      expect.objectContaining({
        manifest: expect.objectContaining({ id: "qwen2.5-0.5b-instruct" }),
        asset: expect.objectContaining({ id: "json-grammar" })
      })
    ]);
  });

  it("allows optional local model assets to be absent", async () => {
    const store = assetStoreWith(["qwen2.5-0.5b-instruct-q4_k_m.gguf"]);

    const availability = await checkLocalModelAvailability(QWEN_2_5_0_5B_ASSET_MANIFEST, store);

    expect(availability.available).toBe(true);
    expect(availability.assets.map((asset) => asset.id)).toEqual(["gguf-model"]);
    expect(availability.missingAssetIds).toEqual([]);
  });

  it("creates a BGE embedding engine only after required assets resolve", async () => {
    const engine = await createBgeEmbeddingEngineFromAssets(assetStoreWith(["model.onnx", "tokenizer.json", "tokenizer_config.json"]), async () => ({
      tokenizer: {
        async tokenize(texts) {
          return {
            inputIds: texts.map(() => [1]),
            attentionMask: texts.map(() => [1])
          };
        }
      },
      session: {
        async run() {
          return {
            last_hidden_state: {
              dims: [1, 1, BGE_SMALL_EN_V15_MODEL.dimension],
              data: Array.from({ length: BGE_SMALL_EN_V15_MODEL.dimension }, () => 1)
            }
          };
        }
      }
    }));

    const unavailable = await createBgeEmbeddingEngineFromAssets(assetStoreWith(["model.onnx"]), async () => {
      throw new Error("Runtime should not load when assets are missing.");
    });

    expect(engine?.id).toBe("local-model-embedding-bge-small-en-v1.5");
    await expect(engine?.embedText("memory")).resolves.toEqual(
      expect.objectContaining({ modelId: "local-model-embedding-bge-small-en-v1.5" })
    );
    expect(unavailable).toBeUndefined();
  });

  it("adapts Transformers.js tokenizer output for BGE ONNX feeds", async () => {
    const tokenizer = createTransformersJsBgeTokenizer(async (texts, options) => {
      expect(options).toEqual({
        padding: true,
        truncation: true,
        return_tensor: false,
        return_token_type_ids: true
      });
      return {
        input_ids: texts.map((_, index) => [101n, BigInt(index + 10), 102n]),
        attention_mask: {
          dims: [texts.length, 3],
          data: [1, 1, 1, 1, 1, 0]
        },
        token_type_ids: texts.map(() => [0, 0, 0])
      };
    });

    await expect(tokenizer.tokenize(["one", "two"])).resolves.toEqual({
      inputIds: [
        [101, 10, 102],
        [101, 11, 102]
      ],
      attentionMask: [
        [1, 1, 1],
        [1, 1, 0]
      ],
      tokenTypeIds: [
        [0, 0, 0],
        [0, 0, 0]
      ]
    });
  });

  it("tokenizes BGE inputs from tokenizer.json without a Transformers.js runtime", async () => {
    const tokenizer = createWordPieceBgeTokenizerFromTokenizerJson(
      JSON.stringify({
        model: {
          unk_token: "[UNK]",
          vocab: {
            "[PAD]": 0,
            "[UNK]": 100,
            "[CLS]": 101,
            "[SEP]": 102,
            old: 201,
            bed: 202,
            "##room": 203,
            "!": 204
          }
        },
        normalizer: { lowercase: true },
        truncation: { max_length: 8 },
        padding: { pad_token: "[PAD]" }
      })
    );

    await expect(tokenizer.tokenize(["Old bedroom!", "unknownword"])).resolves.toEqual({
      inputIds: [
        [101, 201, 202, 203, 204, 102],
        [101, 100, 102, 0, 0, 0]
      ],
      attentionMask: [
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0]
      ],
      tokenTypeIds: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ]
    });
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

  it("normalizes loose local model dates and string tags", async () => {
    const engine = new JsonLocalModelStructuredExtractionEngine({
      id: "loose-fixture",
      displayName: "Loose fixture",
      version: "1.0.0",
      async complete() {
        return JSON.stringify({
          dates: [{ year: 2004 }],
          tags: ["Grandma"],
          emotionalTone: ["joy"]
        });
      }
    });

    await expect(engine.extract({ text: "A memory." })).resolves.toEqual(
      expect.objectContaining({
        dates: [expect.objectContaining({ label: "2004", precision: "year", confidence: 0.5 })],
        tags: [expect.objectContaining({ name: "Grandma", type: "theme", confidence: 0.5 })],
        emotionalTone: [expect.objectContaining({ name: "joy", type: "emotion", confidence: 0.5 })]
      })
    );
  });

  it("keeps rules tags while filtering weak noisy model tags", async () => {
    const baseline = await new RulesStructuredExtractionEngine().extract({
      text: "In 2004 I visited Grandma in Queens."
    });
    const model = await new JsonLocalModelStructuredExtractionEngine({
      id: "noisy-fixture",
      displayName: "Noisy fixture",
      version: "1.0.0",
      async complete() {
        return JSON.stringify({
          dates: [],
          tags: ["I", "visited", "2004", "Grandma", { name: "Queens", type: "place", confidence: 0.82, source: "model" }],
          emotionalTone: []
        });
      }
    }).extract({ text: "In 2004 I visited Grandma in Queens." });

    const merged = mergeStructuredExtractionResults(baseline, model, { sourceText: "In 2004 I visited Grandma in Queens." });

    expect(merged.engineId).toBe("rules-structured+local-model-structured-noisy-fixture");
    expect(merged.tags.map((tag) => tag.name)).toEqual(expect.arrayContaining(["Grandma", "Queens", "family"]));
    expect(merged.tags.map((tag) => tag.name)).not.toEqual(expect.arrayContaining(["I", "visited", "2004"]));
  });

  it("filters high-confidence noisy Qwen pronoun, verb, and year tags", async () => {
    const baseline = await new RulesStructuredExtractionEngine().extract({
      text: "In 2004 I went with Maya to the old house."
    });
    const model = await new JsonLocalModelStructuredExtractionEngine({
      id: "high-noise-fixture",
      displayName: "High-noise fixture",
      version: "1.0.0",
      async complete() {
        return JSON.stringify({
          dates: [],
          tags: [
            { name: "I", type: "person", confidence: 0.99, source: "model" },
            { name: "went", type: "activity", confidence: 0.95, source: "model" },
            { name: "2004", type: "time", confidence: 0.98, source: "model" },
            { name: "Maya", type: "person", confidence: 0.82, source: "model" }
          ],
          emotionalTone: []
        });
      }
    }).extract({ text: "In 2004 I went with Maya to the old house." });

    const merged = mergeStructuredExtractionResults(baseline, model, { sourceText: "In 2004 I went with Maya to the old house." });
    const names = merged.tags.map((tag) => tag.name);

    expect(names).toEqual(expect.arrayContaining(["Maya", "old house"]));
    expect(names).not.toEqual(expect.arrayContaining(["I", "went", "2004"]));
  });

  it("keeps rules output when the Qwen asset path is missing", async () => {
    const baseline = await new RulesStructuredExtractionEngine().extract({
      text: "Maya took the dog to the old house."
    });
    const qwen = await createQwenStructuredExtractionEngineFromAssets(assetStoreWith([]), async () => {
      throw new Error("Runtime should not load when the GGUF path is missing.");
    });
    const result = qwen ? mergeStructuredExtractionResults(baseline, await qwen.extract({ text: "Maya took the dog to the old house." })) : baseline;

    expect(qwen).toBeUndefined();
    expect(result.engineId).toBe("rules-structured");
    expect(result.tags.map((tag) => tag.name)).toEqual(expect.arrayContaining(["Maya", "dog", "old house"]));
  });

  it("keeps BGE readiness independent from Qwen readiness", async () => {
    const bgeReadyQwenMissing = assetStoreWith(["model.onnx", "tokenizer.json", "tokenizer_config.json"]);
    const qwenReadyBgeMissing = assetStoreWith(["qwen2.5-0.5b-instruct-q4_k_m.gguf"]);

    await expect(checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, bgeReadyQwenMissing)).resolves.toEqual(
      expect.objectContaining({ available: true })
    );
    await expect(checkLocalModelAvailability(QWEN_2_5_0_5B_ASSET_MANIFEST, bgeReadyQwenMissing)).resolves.toEqual(
      expect.objectContaining({ available: false, missingAssetIds: ["gguf-model"] })
    );
    await expect(checkLocalModelAvailability(QWEN_2_5_0_5B_ASSET_MANIFEST, qwenReadyBgeMissing)).resolves.toEqual(
      expect.objectContaining({ available: true })
    );
    await expect(checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, qwenReadyBgeMissing)).resolves.toEqual(
      expect.objectContaining({ available: false, missingAssetIds: ["onnx-model", "tokenizer-json", "tokenizer-config"] })
    );
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
    expect(buildQwenStructuredExtractionPrompt({ text: "A memory." })).toContain("Do not tag pronouns");
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

  it("maps Qwen completion requests onto a llama context", async () => {
    let cleared = false;
    let completionRequest: Parameters<LlamaCompletionContext["completion"]>[0] | undefined;
    const runtime = createQwenLlamaCompletionRuntime({
      async clearCache(clearData) {
        cleared = clearData === false;
      },
      async completion(request) {
        completionRequest = request;
        return { content: "{\"dates\":[],\"tags\":[],\"emotionalTone\":[]}" };
      }
    });

    const output = await runtime.complete({
      prompt: "prompt",
      temperature: 0,
      maxTokens: 128,
      stop: ["</s>"],
      grammar: "root ::= object"
    });

    expect(cleared).toBe(true);
    expect(completionRequest).toEqual({
      prompt: "prompt",
      temperature: 0,
      n_predict: 128,
      stop: ["</s>"],
      grammar: "root ::= object"
    });
    expect(output).toContain("dates");
  });

  it("creates a Qwen structured extraction engine from resolved local assets", async () => {
    const engine = await createQwenStructuredExtractionEngineFromAssets(
      assetStoreWith(["qwen2.5-0.5b-instruct-q4_k_m.gguf", "structured-extraction.gbnf"]),
      async (assets) => {
        const grammar = assets.find((asset) => asset.id === "json-grammar")?.uri;
        return {
          ...(grammar ? { grammar } : {}),
          runtime: {
            async complete() {
              return JSON.stringify({
                title: "Window memory",
                dates: [],
                tags: [],
                emotionalTone: []
              });
            }
          }
        };
      }
    );

    const unavailable = await createQwenStructuredExtractionEngineFromAssets(assetStoreWith([]), async () => {
      throw new Error("Runtime should not load when assets are missing.");
    });

    expect(engine?.id).toBe("local-model-structured-qwen2.5-0.5b-instruct");
    await expect(engine?.extract({ text: "A window memory." })).resolves.toEqual(
      expect.objectContaining({ title: "Window memory" })
    );
    expect(unavailable).toBeUndefined();
  });

  it("builds a narrow Qwen transcript-formatting prompt", () => {
    const prompt = buildQwenTranscriptFormattingPrompt("in 2004 maya and i went to queens");

    expect(QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL).toEqual(
      expect.objectContaining({
        id: "qwen2.5-0.5b-instruct",
        runtime: "llama.rn",
        recommendedQuantization: "Q4_K_M"
      })
    );
    expect(prompt).toContain("Add punctuation and capitalization only");
    expect(prompt).toContain("Do not add facts");
    expect(prompt).toContain("Do not change names, dates, places, or meaning");
    expect(prompt).toContain("Return plain text only");
  });

  it("formats transcript drafts through Qwen and returns cleaned plain text", async () => {
    let request: LlamaCompletionRequest | undefined;
    const formatter = createQwenTranscriptFormatter({
      runtime: {
        async complete(input) {
          request = input;
          return "```text\nIn 2004, Maya and I went to Queens.\n```";
        }
      }
    });

    const output = await formatter.format("in 2004 maya and i went to queens");

    expect(output).toBe("In 2004, Maya and I went to Queens.");
    expect(request).toEqual(
      expect.objectContaining({
        temperature: 0,
        stop: ["<|im_end|>", "</s>"]
      })
    );
    expect(request?.prompt).toContain("Preserve the original words as much as possible");
  });

  it("strips surrounding quotes and Markdown from Qwen transcript output", () => {
    expect(cleanQwenTranscriptFormattingOutput('"Patrick slept in the old house."')).toBe("Patrick slept in the old house.");
    expect(cleanQwenTranscriptFormattingOutput("**Patrick slept in the old house.**")).toBe("Patrick slept in the old house.");
    expect(cleanQwenTranscriptFormattingOutput("> Patrick slept in the old house.")).toBe("Patrick slept in the old house.");
  });

  it("keeps meaningful transcript content while cleaning model wrappers", async () => {
    const formatter = createQwenTranscriptFormatter({
      runtime: {
        async complete() {
          return "“In 2004, Maya and I visited Queens with Dr. Lee.”";
        }
      }
    });

    await expect(formatter.format("in 2004 maya and i visited queens with dr lee")).resolves.toBe(
      "In 2004, Maya and I visited Queens with Dr. Lee."
    );
  });

  it("does not load Qwen transcript formatting runtime when assets are missing", async () => {
    let runtimeLoaded = false;
    const formatter = await createQwenTranscriptFormatterFromAssets(assetStoreWith([]), async () => {
      runtimeLoaded = true;
      throw new Error("Runtime should not load when the GGUF path is missing.");
    });

    expect(formatter).toBeUndefined();
    expect(runtimeLoaded).toBe(false);
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

function assetStoreWith(fileNames: string[], byteLengths: Record<string, number> = {}): ILocalModelAssetStore {
  const available = new Set(fileNames);
  return {
    async resolveAsset(asset: LocalModelAsset) {
      if (!available.has(asset.fileName)) return undefined;
      return {
        uri: `file:///models/${asset.fileName}`,
        byteLength: byteLengths[asset.fileName] ?? asset.expectedByteLength ?? 1024
      };
    }
  };
}

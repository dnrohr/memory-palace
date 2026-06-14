import { Platform } from "react-native";
import { createQwenLlamaCompletionRuntime } from "../../../src/processing/qwenLlamaRuntime";
import type { QwenStructuredExtractionModelOptions } from "../../../src/processing/qwenStructuredExtraction";
import type { ResolvedLocalModelAsset } from "../../../src/processing/localModelAssets";

export async function loadQwenNativeRuntimeFromAssets(
  assets: ResolvedLocalModelAsset[]
): Promise<QwenStructuredExtractionModelOptions> {
  if (Platform.OS === "web") {
    throw new Error("Qwen native runtime loading requires iOS or Android.");
  }

  const model = requiredAsset(assets, "gguf-model");
  const grammar = assets.find((asset) => asset.id === "json-grammar")?.uri;
  const { initLlama } = await import("llama.rn");
  const context = await initLlama({
    model: model.uri,
    n_ctx: 2048,
    n_batch: 256,
    n_threads: 4
  });

  return {
    ...(grammar ? { grammar } : {}),
    runtime: createQwenLlamaCompletionRuntime(context)
  };
}

function requiredAsset(assets: ResolvedLocalModelAsset[], id: string): ResolvedLocalModelAsset {
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Required Qwen asset "${id}" was not resolved.`);
  return asset;
}

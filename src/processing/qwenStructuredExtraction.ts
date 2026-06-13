import type { ILocalStructuredExtractionModel, StructuredExtractionInput } from "./structuredExtraction";
import { buildStructuredExtractionPrompt, JsonLocalModelStructuredExtractionEngine } from "./structuredExtraction";

export const QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL = {
  id: "qwen2.5-0.5b-instruct",
  displayName: "Qwen2.5 0.5B Instruct",
  version: "2.5",
  runtime: "llama.rn",
  promptVersion: "qwen2.5-json.v1",
  recommendedQuantization: "Q4_K_M"
} as const;

export type LlamaCompletionRequest = {
  prompt: string;
  temperature: number;
  maxTokens: number;
  stop: string[];
  grammar?: string;
};

export interface ILlamaCompletionRuntime {
  complete(request: LlamaCompletionRequest): Promise<string>;
}

export type QwenStructuredExtractionModelOptions = {
  runtime: ILlamaCompletionRuntime;
  maxTokens?: number;
  grammar?: string;
};

export class QwenStructuredExtractionModel implements ILocalStructuredExtractionModel {
  id = QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL.id;
  displayName = QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL.displayName;
  version = QWEN_2_5_0_5B_STRUCTURED_EXTRACTION_MODEL.version;

  constructor(private readonly options: QwenStructuredExtractionModelOptions) {}

  async complete(prompt: string): Promise<string> {
    return this.options.runtime.complete({
      prompt: toQwenStructuredExtractionPrompt(prompt),
      temperature: 0,
      maxTokens: this.options.maxTokens ?? 700,
      stop: ["<|im_end|>", "</s>"],
      ...(this.options.grammar ? { grammar: this.options.grammar } : {})
    });
  }
}

export class QwenStructuredExtractionEngine extends JsonLocalModelStructuredExtractionEngine {
  constructor(options: QwenStructuredExtractionModelOptions) {
    super(new QwenStructuredExtractionModel(options));
  }
}

export function createQwenStructuredExtractionEngine(options: QwenStructuredExtractionModelOptions): QwenStructuredExtractionEngine {
  return new QwenStructuredExtractionEngine(options);
}

export function buildQwenStructuredExtractionPrompt(input: StructuredExtractionInput): string {
  return toQwenStructuredExtractionPrompt(buildStructuredExtractionPrompt(input));
}

function toQwenStructuredExtractionPrompt(taskPrompt: string): string {
  return [
    "<|im_start|>system",
    "You extract provisional metadata for a private local memory archive.",
    "Return strict JSON only. Do not include Markdown, prose, or commentary.",
    "Use low confidence when the memory is ambiguous. Never invent facts.",
    "<|im_end|>",
    "<|im_start|>user",
    taskPrompt,
    "<|im_end|>",
    "<|im_start|>assistant"
  ].join("\n");
}

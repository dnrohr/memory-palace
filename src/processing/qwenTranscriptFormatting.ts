import type { ILlamaCompletionRuntime } from "./qwenStructuredExtraction";

export const QWEN_TRANSCRIPT_FORMATTING_UNAVAILABLE_MESSAGE =
  "Qwen local model is not ready. Import the Qwen model in Settings to format transcripts.";

export const QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL = {
  id: "qwen2.5-0.5b-instruct",
  displayName: "Qwen2.5 0.5B Instruct",
  version: "2.5",
  runtime: "llama.rn",
  promptVersion: "qwen2.5-transcript-format.v1",
  recommendedQuantization: "Q4_K_M"
} as const;

export type QwenTranscriptFormattingOptions = {
  runtime: ILlamaCompletionRuntime;
  maxTokens?: number;
};

export class QwenTranscriptFormatter {
  id = `local-model-transcript-format-${QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL.id}`;
  displayName = QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL.displayName;
  version = QWEN_2_5_0_5B_TRANSCRIPT_FORMATTING_MODEL.version;

  constructor(private readonly options: QwenTranscriptFormattingOptions) {}

  async format(transcript: string): Promise<string> {
    const input = transcript.trim();
    if (!input) return "";

    const raw = await this.options.runtime.complete({
      prompt: buildQwenTranscriptFormattingPrompt(input),
      temperature: 0,
      maxTokens: this.options.maxTokens ?? maxTranscriptFormattingTokens(input),
      stop: ["<|im_end|>", "</s>"]
    });

    const formatted = cleanQwenTranscriptFormattingOutput(raw);
    if (!hasSameWordSequence(input, formatted)) {
      throw new Error("Qwen transcript formatting changed the draft words.");
    }

    return formatted;
  }
}

export function createQwenTranscriptFormatter(options: QwenTranscriptFormattingOptions): QwenTranscriptFormatter {
  return new QwenTranscriptFormatter(options);
}

export function buildQwenTranscriptFormattingPrompt(transcript: string): string {
  return [
    "<|im_start|>system",
    "You format speech-to-text memory drafts.",
    "Add punctuation and capitalization only.",
    "Keep every input word in the same order.",
    "Preserve the original words as much as possible.",
    "If a word is unclear, leave it unchanged.",
    "Do not summarize.",
    "Do not add facts.",
    "Do not change names, dates, places, or meaning.",
    "Return plain text only, no Markdown, JSON, commentary, or quotes.",
    "<|im_end|>",
    "<|im_start|>user",
    transcript,
    "<|im_end|>",
    "<|im_start|>assistant"
  ].join("\n");
}

export function hasSameWordSequence(input: string, output: string): boolean {
  const inputWords = normalizedWords(input);
  const outputWords = normalizedWords(output);
  if (inputWords.length === 0 || outputWords.length === 0) return inputWords.length === outputWords.length;
  if (inputWords.length !== outputWords.length) return false;
  return inputWords.every((word, index) => word === outputWords[index]);
}

export function cleanQwenTranscriptFormattingOutput(raw: string): string {
  let output = raw.trim();
  output = stripWholeCodeFence(output).trim();
  output = stripMarkdownBlockquote(output).trim();
  output = stripSymmetricWrapper(output, "**", "**").trim();
  output = stripSymmetricWrapper(output, "__", "__").trim();
  output = stripSurroundingQuote(output).trim();
  return output;
}

function maxTranscriptFormattingTokens(input: string): number {
  return Math.min(1200, Math.max(128, Math.ceil(input.length / 3) + 96));
}

function stripWholeCodeFence(value: string): string {
  const match = value.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```$/);
  return match?.[1] ?? value;
}

function stripMarkdownBlockquote(value: string): string {
  if (!value.split(/\r?\n/).every((line) => line.trimStart().startsWith(">"))) return value;
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*>\s?/, ""))
    .join("\n");
}

function stripSymmetricWrapper(value: string, open: string, close: string): string {
  if (!value.startsWith(open) || !value.endsWith(close) || value.length <= open.length + close.length) return value;
  return value.slice(open.length, -close.length);
}

function stripSurroundingQuote(value: string): string {
  const pairs: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"]
  ];

  for (const [open, close] of pairs) {
    if (value.startsWith(open) && value.endsWith(close) && value.length > open.length + close.length) {
      return value.slice(open.length, -close.length);
    }
  }

  return value;
}

function normalizedWords(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean);
}

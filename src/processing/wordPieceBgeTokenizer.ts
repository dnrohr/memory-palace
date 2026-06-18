import type { BgeTokenizedBatch, IBgeTokenizer } from "./bgeEmbeddings";

export type WordPieceTokenizerConfig = {
  vocab: Record<string, number>;
  lowercase?: boolean;
  maxLength?: number;
  unkToken?: string;
  clsToken?: string;
  sepToken?: string;
  padToken?: string;
};

export class WordPieceBgeTokenizer implements IBgeTokenizer {
  private readonly lowercase: boolean;
  private readonly maxLength: number;
  private readonly unkToken: string;
  private readonly clsToken: string;
  private readonly sepToken: string;
  private readonly padToken: string;

  constructor(private readonly config: WordPieceTokenizerConfig) {
    this.lowercase = config.lowercase ?? true;
    this.maxLength = config.maxLength ?? 512;
    this.unkToken = config.unkToken ?? "[UNK]";
    this.clsToken = config.clsToken ?? "[CLS]";
    this.sepToken = config.sepToken ?? "[SEP]";
    this.padToken = config.padToken ?? "[PAD]";
  }

  async tokenize(texts: string[]): Promise<BgeTokenizedBatch> {
    const rows = texts.map((text) => this.tokenizeOne(text));
    const paddedLength = Math.min(this.maxLength, Math.max(...rows.map((row) => row.length), 1));
    const padId = this.idFor(this.padToken);

    return {
      inputIds: rows.map((row) => padRow(row, paddedLength, padId)),
      attentionMask: rows.map((row) => padRow(Array.from({ length: Math.min(row.length, paddedLength) }, () => 1), paddedLength, 0)),
      tokenTypeIds: rows.map((row) => padRow(Array.from({ length: Math.min(row.length, paddedLength) }, () => 0), paddedLength, 0))
    };
  }

  private tokenizeOne(text: string): number[] {
    const tokenIds = [this.idFor(this.clsToken)];
    for (const token of splitForWordPiece(this.lowercase ? text.toLocaleLowerCase() : text)) {
      tokenIds.push(...this.wordPieceTokenIds(token));
      if (tokenIds.length >= this.maxLength - 1) break;
    }
    tokenIds.push(this.idFor(this.sepToken));
    return tokenIds.slice(0, this.maxLength);
  }

  private wordPieceTokenIds(token: string): number[] {
    if (this.config.vocab[token] !== undefined) return [this.config.vocab[token]];

    const pieces: number[] = [];
    let start = 0;
    while (start < token.length) {
      let end = token.length;
      let current: string | undefined;

      while (start < end) {
        const candidate = start === 0 ? token.slice(start, end) : `##${token.slice(start, end)}`;
        if (this.config.vocab[candidate] !== undefined) {
          current = candidate;
          break;
        }
        end -= 1;
      }

      if (!current) return [this.idFor(this.unkToken)];
      pieces.push(this.idFor(current));
      start = end;
    }

    return pieces;
  }

  private idFor(token: string): number {
    const id = this.config.vocab[token];
    if (id === undefined) throw new Error(`BGE tokenizer vocabulary is missing "${token}".`);
    return id;
  }
}

export function createWordPieceBgeTokenizerFromTokenizerJson(tokenizerJson: string): IBgeTokenizer {
  const parsed = JSON.parse(tokenizerJson) as {
    model?: { vocab?: Record<string, number>; unk_token?: string };
    normalizer?: { lowercase?: boolean } | { normalizers?: Array<{ lowercase?: boolean }> };
    post_processor?: { cls?: [string, number]; sep?: [string, number] };
    padding?: { pad_token?: string; length?: number };
    truncation?: { max_length?: number };
  };
  const vocab = parsed.model?.vocab;
  if (!vocab) throw new Error("BGE tokenizer.json is missing a WordPiece vocabulary.");

  const config: WordPieceTokenizerConfig = {
    vocab,
    lowercase: normalizerLowercases(parsed.normalizer),
    maxLength: parsed.truncation?.max_length ?? parsed.padding?.length ?? 512
  };
  if (parsed.model?.unk_token) config.unkToken = parsed.model.unk_token;
  if (parsed.post_processor?.cls?.[0]) config.clsToken = parsed.post_processor.cls[0];
  if (parsed.post_processor?.sep?.[0]) config.sepToken = parsed.post_processor.sep[0];
  if (parsed.padding?.pad_token) config.padToken = parsed.padding.pad_token;

  return new WordPieceBgeTokenizer(config);
}

function normalizerLowercases(normalizer: unknown): boolean {
  if (!normalizer || typeof normalizer !== "object") return true;
  if ("lowercase" in normalizer && typeof normalizer.lowercase === "boolean") return normalizer.lowercase;
  if ("normalizers" in normalizer && Array.isArray(normalizer.normalizers)) {
    const bertNormalizer = normalizer.normalizers.find(
      (candidate) => candidate && typeof candidate === "object" && "lowercase" in candidate && typeof candidate.lowercase === "boolean"
    ) as { lowercase?: boolean } | undefined;
    return bertNormalizer?.lowercase ?? true;
  }
  return true;
}

function splitForWordPiece(text: string): string[] {
  return text
    .replace(/\p{P}/gu, " $& ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function padRow(row: number[], length: number, padId: number): number[] {
  const trimmed = row.slice(0, length);
  while (trimmed.length < length) trimmed.push(padId);
  return trimmed;
}

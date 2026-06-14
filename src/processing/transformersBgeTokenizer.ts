import type { BgeTokenizedBatch, IBgeTokenizer } from "./bgeEmbeddings";

export type TransformersTokenizerOutput = {
  input_ids: TensorOrArrayLike;
  attention_mask: TensorOrArrayLike;
  token_type_ids?: TensorOrArrayLike;
};

export type TensorOrArrayLike =
  | number[][]
  | bigint[][]
  | {
      data: ArrayLike<number | bigint>;
      dims: readonly number[];
    };

export type TransformersTokenizerCallable = (
  texts: string[],
  options: {
    padding: boolean | "max_length";
    truncation: boolean;
    return_tensor: false;
    return_token_type_ids: boolean;
  }
) => TransformersTokenizerOutput | Promise<TransformersTokenizerOutput>;

export class TransformersJsBgeTokenizer implements IBgeTokenizer {
  constructor(private readonly tokenizer: TransformersTokenizerCallable) {}

  async tokenize(texts: string[]): Promise<BgeTokenizedBatch> {
    const output = await this.tokenizer(texts, {
      padding: true,
      truncation: true,
      return_tensor: false,
      return_token_type_ids: true
    });

    return {
      inputIds: toNumberRows(output.input_ids),
      attentionMask: toNumberRows(output.attention_mask),
      ...(output.token_type_ids ? { tokenTypeIds: toNumberRows(output.token_type_ids) } : {})
    };
  }
}

export function createTransformersJsBgeTokenizer(tokenizer: TransformersTokenizerCallable): IBgeTokenizer {
  return new TransformersJsBgeTokenizer(tokenizer);
}

function toNumberRows(value: TensorOrArrayLike): number[][] {
  if (Array.isArray(value)) {
    return value.map((row) => row.map((item) => Number(item)));
  }

  const [batchSize, tokenCount] = value.dims;
  if (!batchSize || !tokenCount || value.dims.length !== 2) {
    throw new Error("Tokenizer output must be a [batch, tokens] tensor or nested array.");
  }

  const rows: number[][] = [];
  for (let batchIndex = 0; batchIndex < batchSize; batchIndex += 1) {
    const row: number[] = [];
    for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex += 1) {
      row.push(Number(value.data[batchIndex * tokenCount + tokenIndex] ?? 0));
    }
    rows.push(row);
  }
  return rows;
}

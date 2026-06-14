import type { ILlamaCompletionRuntime, LlamaCompletionRequest } from "./qwenStructuredExtraction";

export type LlamaCompletionContext = {
  completion(request: {
    prompt: string;
    temperature: number;
    n_predict: number;
    stop: string[];
    grammar?: string;
  }): Promise<{ content?: string; text?: string }>;
  clearCache?(clearData?: boolean): Promise<void>;
};

export class QwenLlamaCompletionRuntime implements ILlamaCompletionRuntime {
  constructor(private readonly context: LlamaCompletionContext) {}

  async complete(request: LlamaCompletionRequest): Promise<string> {
    await this.context.clearCache?.(false);
    const result = await this.context.completion({
      prompt: request.prompt,
      temperature: request.temperature,
      n_predict: request.maxTokens,
      stop: request.stop,
      ...(request.grammar ? { grammar: request.grammar } : {})
    });
    return result.content ?? result.text ?? "";
  }
}

export function createQwenLlamaCompletionRuntime(context: LlamaCompletionContext): ILlamaCompletionRuntime {
  return new QwenLlamaCompletionRuntime(context);
}

import { describe, expect, it } from "vitest";
import { ManualTextTranscriptionEngine } from "../src/transcription/contracts";

describe("transcription contract", () => {
  it("keeps manual entry available as an offline transcription fallback", async () => {
    const engine = new ManualTextTranscriptionEngine();
    const result = await engine.transcribe({ uri: "manual://draft" });

    expect(engine.supportsOffline).toBe(true);
    expect(result).toEqual({
      text: "",
      engineId: "manual-text",
      engineVersion: "0.1.0"
    });
  });
});


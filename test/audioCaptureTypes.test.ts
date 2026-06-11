import { describe, expect, it } from "vitest";
import type { AudioCaptureDraft } from "../apps/mobile/src/audioCapture";

describe("audio capture draft contract", () => {
  it("carries audio artifact metadata and editable transcript text", () => {
    const draft: AudioCaptureDraft = {
      artifact: {
        uri: "file:///memory.m4a",
        mimeType: "audio/m4a",
        durationMs: 1200
      },
      transcript: "",
      retainAudio: false
    };

    expect(draft.artifact.durationMs).toBe(1200);
    expect(draft.retainAudio).toBe(false);
  });
});


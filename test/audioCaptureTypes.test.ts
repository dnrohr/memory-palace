import { describe, expect, it } from "vitest";
import type { AudioCaptureDraft, AudioCaptureErrorCode } from "../apps/mobile/src/audioCapture";

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

  it("classifies audio capture error codes", () => {
    const code: AudioCaptureErrorCode = "missing_audio_uri";

    expect(code).toBe("missing_audio_uri");
  });
});

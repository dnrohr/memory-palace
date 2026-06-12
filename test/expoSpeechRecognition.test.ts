import { describe, expect, it } from "vitest";
import { ExpoSpeechRecognitionTranscriptionEngine } from "../src/transcription/expoSpeechRecognition";

describe("Expo speech recognition transcription engine", () => {
  it("maps native final results into transcription results", async () => {
    const listeners = new Map<string, (event: never) => void>();
    const engine = new ExpoSpeechRecognitionTranscriptionEngine(async () => ({
      requestPermissionsAsync: async () => ({ granted: true }),
      isRecognitionAvailable: () => true,
      supportsOnDeviceRecognition: () => true,
      addListener: (eventName, listener) => {
        listeners.set(eventName, listener);
        return { remove: () => listeners.delete(eventName) };
      },
      abort: () => undefined,
      start: () => {
        listeners.get("result")?.({
          isFinal: true,
          results: [
            {
              transcript: "Patrick slept in the old house.",
              confidence: 0.91,
              segments: [
                {
                  startTimeMillis: 0,
                  endTimeMillis: 500,
                  segment: "Patrick",
                  confidence: 0.9
                }
              ]
            }
          ]
        } as never);
        listeners.get("end")?.(null as never);
      }
    }));

    await expect(engine.transcribe({ uri: "file:///memory.wav" })).resolves.toEqual({
      text: "Patrick slept in the old house.",
      confidence: 0.91,
      engineId: "expo-speech-recognition",
      engineVersion: "expo-speech-recognition",
      language: "en-US",
      segments: [{ text: "Patrick", startMs: 0, endMs: 500, confidence: 0.9 }]
    });
  });

  it("fails clearly when native recognition is unavailable", async () => {
    const engine = new ExpoSpeechRecognitionTranscriptionEngine(async () => ({
      requestPermissionsAsync: async () => ({ granted: true }),
      isRecognitionAvailable: () => false,
      supportsOnDeviceRecognition: () => false,
      addListener: () => ({ remove: () => undefined }),
      abort: () => undefined,
      start: () => undefined
    }));

    await expect(engine.transcribe({ uri: "file:///memory.wav" })).rejects.toThrow("not available");
  });
});

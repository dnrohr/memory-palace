import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    async getItem(key: string) {
      return storage.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      storage.set(key, value);
    }
  }
}));

describe("mobile settings store", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("defaults older settings to the hash embedding engine", async () => {
    const { loadAppSettings } = await import("../apps/mobile/src/settingsStore");
    storage.set(
      "memory-palace.settings.v1",
      JSON.stringify({
        structuredExtractionMode: "rules",
        embeddingMaintenanceMode: "manual",
        appearanceMode: "dark"
      })
    );

    await expect(loadAppSettings()).resolves.toEqual(
      expect.objectContaining({
        structuredExtractionMode: "rules",
        embeddingEngineMode: "hash",
        embeddingMaintenanceMode: "manual",
        appearanceMode: "dark"
      })
    );
  });

  it("persists explicit local model modes", async () => {
    const { loadAppSettings, saveEmbeddingEngineMode, saveStructuredExtractionMode } = await import("../apps/mobile/src/settingsStore");

    await saveStructuredExtractionMode("qwen2.5-0.5b");
    await saveEmbeddingEngineMode("bge-small-en-v1.5");

    await expect(loadAppSettings()).resolves.toEqual(
      expect.objectContaining({
        structuredExtractionMode: "qwen2.5-0.5b",
        embeddingEngineMode: "bge-small-en-v1.5"
      })
    );
  });
});

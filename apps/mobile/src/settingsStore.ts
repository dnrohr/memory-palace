import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EncryptionSettings } from "../../../src/security/encryption";

const SETTINGS_KEY = "memory-palace.settings.v1";

export type StructuredExtractionMode = "none" | "rules" | "qwen2.5-0.5b";
export type EmbeddingEngineMode = "hash" | "bge-small-en-v1.5";
export type EmbeddingMaintenanceMode = "automatic" | "manual";
export type AppearanceMode = "light" | "dark";

export type AppSettings = {
  encryptionSettings: EncryptionSettings;
  structuredExtractionMode: StructuredExtractionMode;
  embeddingEngineMode: EmbeddingEngineMode;
  embeddingMaintenanceMode: EmbeddingMaintenanceMode;
  appearanceMode: AppearanceMode;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  encryptionSettings: {
    scope: "disabled",
    keySource: "none",
    requireUnlockForExport: false
  },
  structuredExtractionMode: "rules",
  embeddingEngineMode: "hash",
  embeddingMaintenanceMode: "automatic",
  appearanceMode: "light"
};

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_APP_SETTINGS;

  const parsed = JSON.parse(raw) as Partial<AppSettings>;
  return normalizeSettings(parsed);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

export async function saveEncryptionSettings(settings: EncryptionSettings): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = normalizeSettings({ ...current, encryptionSettings: settings });
  await saveAppSettings(next);
  return next;
}

export async function saveStructuredExtractionMode(mode: StructuredExtractionMode): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = normalizeSettings({ ...current, structuredExtractionMode: mode });
  await saveAppSettings(next);
  return next;
}

export async function saveEmbeddingEngineMode(mode: EmbeddingEngineMode): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = normalizeSettings({ ...current, embeddingEngineMode: mode });
  await saveAppSettings(next);
  return next;
}

export async function saveEmbeddingMaintenanceMode(mode: EmbeddingMaintenanceMode): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = normalizeSettings({ ...current, embeddingMaintenanceMode: mode });
  await saveAppSettings(next);
  return next;
}

export async function saveAppearanceMode(mode: AppearanceMode): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = normalizeSettings({ ...current, appearanceMode: mode });
  await saveAppSettings(next);
  return next;
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  const encryptionSettings = settings.encryptionSettings ?? DEFAULT_APP_SETTINGS.encryptionSettings;
  const scope = encryptionSettings.scope ?? DEFAULT_APP_SETTINGS.encryptionSettings.scope;

  return {
    encryptionSettings: {
      scope,
      keySource: scope === "disabled" ? "none" : encryptionSettings.keySource ?? "user_passphrase",
      requireUnlockForExport: Boolean(encryptionSettings.requireUnlockForExport)
    },
    structuredExtractionMode:
      settings.structuredExtractionMode === "none" ||
      settings.structuredExtractionMode === "rules" ||
      settings.structuredExtractionMode === "qwen2.5-0.5b"
        ? settings.structuredExtractionMode
        : DEFAULT_APP_SETTINGS.structuredExtractionMode,
    embeddingEngineMode:
      settings.embeddingEngineMode === "hash" || settings.embeddingEngineMode === "bge-small-en-v1.5"
        ? settings.embeddingEngineMode
        : DEFAULT_APP_SETTINGS.embeddingEngineMode,
    embeddingMaintenanceMode:
      settings.embeddingMaintenanceMode === "manual" || settings.embeddingMaintenanceMode === "automatic"
        ? settings.embeddingMaintenanceMode
        : DEFAULT_APP_SETTINGS.embeddingMaintenanceMode,
    appearanceMode:
      settings.appearanceMode === "dark" || settings.appearanceMode === "light"
        ? settings.appearanceMode
        : DEFAULT_APP_SETTINGS.appearanceMode
  };
}

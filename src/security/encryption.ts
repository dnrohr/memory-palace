export type EncryptionScope = "disabled" | "exports" | "archive";

export type EncryptionKeySource = "none" | "device_secure_store" | "user_passphrase";

export type EncryptionSettings = {
  scope: EncryptionScope;
  keySource: EncryptionKeySource;
  requireUnlockForExport: boolean;
};

export type EncryptionStatus = {
  providerId: string;
  available: boolean;
  active: boolean;
  settings: EncryptionSettings;
  warning?: string;
};

export interface IEncryptionProvider {
  getSettings(): Promise<EncryptionSettings>;
  saveSettings(settings: EncryptionSettings): Promise<void>;
  getStatus(): Promise<EncryptionStatus>;
}

export const DISABLED_ENCRYPTION_SETTINGS: EncryptionSettings = {
  scope: "disabled",
  keySource: "none",
  requireUnlockForExport: false
};

export class NoEncryptionProvider implements IEncryptionProvider {
  private settings = DISABLED_ENCRYPTION_SETTINGS;

  async getSettings(): Promise<EncryptionSettings> {
    return this.settings;
  }

  async saveSettings(settings: EncryptionSettings): Promise<void> {
    this.settings = {
      ...settings,
      keySource: settings.scope === "disabled" ? "none" : settings.keySource
    };
  }

  async getStatus(): Promise<EncryptionStatus> {
    return {
      providerId: "none",
      available: false,
      active: false,
      settings: this.settings,
      warning: "No encryption provider is installed. Data remains protected only by device storage controls."
    };
  }
}

export type AppLockMode = "disabled" | "pin" | "biometric";

export type AppLockSettings = {
  mode: AppLockMode;
  autoLockTimeoutMs: number;
  hidePreviewsInSwitcher: boolean;
};

export interface IAppLockProvider {
  getSettings(): Promise<AppLockSettings>;
  saveSettings(settings: AppLockSettings): Promise<void>;
  unlock(secret?: string): Promise<boolean>;
  lock(): Promise<void>;
  isLocked(): Promise<boolean>;
}

export class NoAppLockProvider implements IAppLockProvider {
  private locked = false;
  private settings: AppLockSettings = {
    mode: "disabled",
    autoLockTimeoutMs: 0,
    hidePreviewsInSwitcher: false
  };

  async getSettings(): Promise<AppLockSettings> {
    return this.settings;
  }

  async saveSettings(settings: AppLockSettings): Promise<void> {
    this.settings = settings;
    this.locked = settings.mode !== "disabled";
  }

  async unlock(_secret?: string): Promise<boolean> {
    this.locked = false;
    return true;
  }

  async lock(): Promise<void> {
    this.locked = this.settings.mode !== "disabled";
  }

  async isLocked(): Promise<boolean> {
    return this.locked;
  }
}

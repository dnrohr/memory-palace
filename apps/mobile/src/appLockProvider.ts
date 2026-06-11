import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppLockSettings, IAppLockProvider } from "../../../src/security/appLock";

const SETTINGS_KEY = "memory-palace.app-lock.v1";

const defaultSettings: AppLockSettings = {
  mode: "disabled",
  autoLockTimeoutMs: 0,
  hidePreviewsInSwitcher: false
};

export class ExpoBiometricAppLockProvider implements IAppLockProvider {
  private locked = false;

  async getSettings(): Promise<AppLockSettings> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...(JSON.parse(raw) as AppLockSettings) } : defaultSettings;
  }

  async saveSettings(settings: AppLockSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    this.locked = settings.mode !== "disabled";
  }

  async unlock(secret?: string): Promise<boolean> {
    const settings = await this.getSettings();
    if (settings.mode === "disabled") {
      this.locked = false;
      return true;
    }

    if (settings.mode === "pin") {
      this.locked = !secret;
      return Boolean(secret);
    }

    const LocalAuthentication = await import("expo-local-authentication");
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Memory Palace",
      cancelLabel: "Cancel",
      disableDeviceFallback: false
    });
    this.locked = !result.success;
    return result.success;
  }

  async lock(): Promise<void> {
    const settings = await this.getSettings();
    this.locked = settings.mode !== "disabled";
  }

  async isLocked(): Promise<boolean> {
    return this.locked;
  }
}

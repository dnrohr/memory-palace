import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppLockSettings, IAppLockProvider } from "../../../src/security/appLock";

const SETTINGS_KEY = "memory-palace.app-lock.v1";
const PIN_KEY = "memory-palace.app-lock.pin.v1";

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
      const savedPin = await this.getSavedPin();
      const success = Boolean(secret && savedPin && secret === savedPin);
      this.locked = !success;
      return success;
    }

    const success = await this.authenticateBiometric("Unlock memory palace");
    this.locked = !success;
    return success;
  }

  async lock(): Promise<void> {
    const settings = await this.getSettings();
    this.locked = settings.mode !== "disabled";
  }

  async isLocked(): Promise<boolean> {
    return this.locked;
  }

  async savePin(pin: string): Promise<void> {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(PIN_KEY, pin);
    await this.saveSettings({
      mode: "pin",
      autoLockTimeoutMs: 60_000,
      hidePreviewsInSwitcher: true
    });
  }

  async clearPin(): Promise<void> {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(PIN_KEY);
    await this.saveSettings(defaultSettings);
  }

  private async getSavedPin(): Promise<string | null> {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(PIN_KEY);
  }

  async enableBiometricLock(): Promise<AppLockSettings> {
    const success = await this.authenticateBiometric("Enable biometric lock");
    if (!success) {
      throw new Error("Biometric unlock was not completed.");
    }

    const settings: AppLockSettings = {
      mode: "biometric",
      autoLockTimeoutMs: 60_000,
      hidePreviewsInSwitcher: true
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    this.locked = false;
    return settings;
  }

  private async authenticateBiometric(promptMessage: string): Promise<boolean> {
    const LocalAuthentication = await import("expo-local-authentication");
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      throw new Error("Biometric hardware is not available on this device.");
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      throw new Error("No biometric or device credential is enrolled on this device.");
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      disableDeviceFallback: false
    });
    return result.success;
  }
}

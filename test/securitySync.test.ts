import { describe, expect, it } from "vitest";
import { NoAppLockProvider } from "../src/security/appLock";
import { NoEncryptionProvider, WebCryptoExportEncryptionProvider } from "../src/security/encryption";
import { NoSyncProvider } from "../src/sync/contracts";

describe("security and sync seams", () => {
  it("keeps app lock disabled by default but supports lock state", async () => {
    const provider = new NoAppLockProvider();

    await expect(provider.isLocked()).resolves.toBe(false);
    await provider.saveSettings({ mode: "pin", autoLockTimeoutMs: 60_000, hidePreviewsInSwitcher: true });
    await expect(provider.isLocked()).resolves.toBe(true);
    await expect(provider.unlock("1234")).resolves.toBe(true);
    await expect(provider.isLocked()).resolves.toBe(false);
  });

  it("keeps sync disabled by default", async () => {
    const provider = new NoSyncProvider();

    await expect(provider.getStatus()).resolves.toEqual({
      providerId: "none",
      enabled: false,
      pendingChangeCount: 0
    });
    await expect(provider.sync()).resolves.toEqual({
      status: {
        providerId: "none",
        enabled: false,
        pendingChangeCount: 0
      },
      pushedCount: 0,
      pulledCount: 0,
      conflicts: []
    });
  });

  it("exposes encryption preferences while disabled without a provider", async () => {
    const provider = new NoEncryptionProvider();

    await expect(provider.getStatus()).resolves.toEqual(
      expect.objectContaining({
        providerId: "none",
        available: false,
        active: false
      })
    );

    await provider.saveSettings({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });

    await expect(provider.getSettings()).resolves.toEqual({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    await expect(provider.getStatus()).resolves.toEqual(expect.objectContaining({ active: false }));
  });

  it("encrypts and decrypts export text with a passphrase provider", async () => {
    const provider = new WebCryptoExportEncryptionProvider({ iterations: 1_000 });
    await provider.saveSettings({
      scope: "exports",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });

    await expect(provider.getStatus()).resolves.toEqual(
      expect.objectContaining({
        providerId: "web-crypto-export",
        available: true,
        active: true
      })
    );

    const envelope = await provider.encryptText("private archive", "correct horse battery staple", {
      fileName: "memory-palace-export.json",
      mediaType: "application/json"
    });

    expect(envelope).toEqual(
      expect.objectContaining({
        format: "memory-palace.encrypted.v1",
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256",
        fileName: "memory-palace-export.json"
      })
    );
    expect(envelope.ciphertext).not.toEqual([...new TextEncoder().encode("private archive")]);
    await expect(provider.decryptText(envelope, "correct horse battery staple")).resolves.toBe("private archive");
    await expect(provider.decryptText(envelope, "wrong passphrase")).rejects.toThrow();
  });
});

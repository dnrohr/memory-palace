import { describe, expect, it } from "vitest";
import { NoAppLockProvider } from "../src/security/appLock";
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
});


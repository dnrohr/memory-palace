import { describe, expect, it } from "vitest";
import { join } from "node:path";

type Pixel8PreflightModule = {
  adbCandidates: (env?: Record<string, string | undefined>) => string[];
  findAdb: (
    env?: Record<string, string | undefined>,
    runCommand?: (command: string, args: string[]) => { ok: boolean; output: string }
  ) => { command: string; result: { ok: boolean; output: string } } | undefined;
  javaHomeCandidates: (env?: Record<string, string | undefined>) => string[];
  parseAndroidDevices: (output: string) => { devices: string[]; unavailable: string[] };
  readyAndroidDeviceSerials: (output: string) => string[];
  readyAndroidDeviceTargets: (output: string) => Array<{ serial: string; name: string }>;
};

async function loadPreflight(): Promise<Pixel8PreflightModule> {
  return (await import("../scripts/pixel8-preflight.mjs")) as Pixel8PreflightModule;
}

describe("Pixel 8 preflight helpers", () => {
  it("parses ready, unauthorized, and offline adb devices", async () => {
    const { parseAndroidDevices } = await loadPreflight();
    const parsed = parseAndroidDevices(`List of devices attached
pixel-ready\tdevice
pixel-waiting\tunauthorized
emulator-5554\toffline

`);

    expect(parsed.devices).toEqual(["pixel-ready\tdevice"]);
    expect(parsed.unavailable).toEqual(["pixel-waiting\tunauthorized", "emulator-5554\toffline"]);
  });

  it("checks PATH adb before SDK candidates", async () => {
    const { adbCandidates } = await loadPreflight();
    const candidates = adbCandidates({
      ANDROID_HOME: "C:/Android/Sdk",
      ANDROID_SDK_ROOT: "C:/Android/Sdk",
      LOCALAPPDATA: "C:/Users/example/AppData/Local"
    });

    expect(candidates[0]).toBe("adb");
    expect(candidates).toContain("C:\\Android\\Sdk\\platform-tools\\adb.exe");
    expect(candidates.filter((candidate) => candidate.includes("C:\\Android\\Sdk"))).toHaveLength(1);
  });

  it("returns the first adb candidate that can list devices", async () => {
    const { findAdb } = await loadPreflight();
    const attempts: Array<{ command: string; args: string[] }> = [];
    const found = findAdb({}, (command, args) => {
      attempts.push({ command, args });
      return { ok: command === "adb", output: "List of devices attached\npixel\tdevice\n" };
    });

    expect(found?.command).toBe("adb");
    expect(found?.result.output).toContain("pixel");
    expect(attempts).toEqual([{ command: "adb", args: ["devices"] }]);
  });

  it("extracts ready device serials for non-interactive Expo builds", async () => {
    const { readyAndroidDeviceSerials, readyAndroidDeviceTargets } = await loadPreflight();
    const adbOutput = `List of devices attached
47091JEKB05516         device product:akita model:Pixel_8a device:akita transport_id:1
waiting                unauthorized product:akita model:Pixel_8a
`;

    expect(readyAndroidDeviceSerials(adbOutput)).toEqual(["47091JEKB05516"]);
    expect(readyAndroidDeviceTargets(adbOutput)).toEqual([{ serial: "47091JEKB05516", name: "Pixel_8a" }]);
  });

  it("checks Android Studio JBR and installed JDK roots for Java", async () => {
    const { javaHomeCandidates } = await loadPreflight();

    expect(javaHomeCandidates({ ProgramFiles: "C:/Program Files" })).toContain(
      join("C:/Program Files", "Android", "Android Studio", "jbr")
    );
  });
});

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url);
const rootPath = fileURLToPath(root);
const requiredFiles = ["PIXEL_8_TEST.md", "docs/pixel-8-result-template.md"];
const requiredScripts = ["verify", "pixel8:build", "pixel8", "pixel8:tunnel", "pixel8:preflight"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function run(command, args) {
  try {
    return {
      ok: true,
      output: execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    };
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`.trim()
    };
  }
}

export function parseAndroidDevices(adbOutput) {
  const devices = [];
  const unavailable = [];

  for (const line of adbOutput
    .split(/\r?\n/)
    .slice(1)
    .map((value) => value.trim())
    .filter(Boolean)) {
    const [serial, state] = line.split(/\s+/);
    if (!serial || !state) continue;
    if (state === "device") {
      devices.push(line);
    } else if (state === "unauthorized" || state === "offline") {
      unavailable.push(line);
    }
  }

  return { devices, unavailable };
}

export function readyAndroidDeviceSerials(adbOutput) {
  return parseAndroidDevices(adbOutput).devices.map((line) => line.split(/\s+/)[0]).filter(Boolean);
}

export function readyAndroidDeviceTargets(adbOutput) {
  return parseAndroidDevices(adbOutput).devices.map((line) => {
    const serial = line.split(/\s+/)[0];
    const modelMatch = line.match(/\bmodel:([^\s]+)/);
    return {
      serial,
      name: modelMatch?.[1] ?? serial
    };
  });
}

export function adbCandidates(env = process.env) {
  const executable = process.platform === "win32" ? "adb.exe" : "adb";
  const candidates = ["adb"];
  const sdkRoots = [env.ANDROID_HOME, env.ANDROID_SDK_ROOT, env.LOCALAPPDATA ? join(env.LOCALAPPDATA, "Android", "Sdk") : undefined]
    .filter((value, index, values) => value && values.indexOf(value) === index);

  for (const sdkRoot of sdkRoots) {
    candidates.push(join(sdkRoot, "platform-tools", executable));
  }

  return candidates;
}

export function findAdb(env = process.env, runCommand = run) {
  for (const candidate of adbCandidates(env)) {
    if (candidate !== "adb" && !existsSync(candidate)) continue;
    const result = runCommand(candidate, ["devices"]);
    if (result.ok) return { command: candidate, result };
  }

  return undefined;
}

export function javaHomeCandidates(env = process.env) {
  const candidates = [];
  if (env.JAVA_HOME) candidates.push(env.JAVA_HOME);
  if (env.ProgramFiles) {
    candidates.push(join(env.ProgramFiles, "Android", "Android Studio", "jbr"));
    const adoptiumRoot = join(env.ProgramFiles, "Eclipse Adoptium");
    if (existsSync(adoptiumRoot)) {
      for (const entry of readdirSync(adoptiumRoot)) {
        candidates.push(join(adoptiumRoot, entry));
      }
    }
    const javaRoot = join(env.ProgramFiles, "Java");
    if (existsSync(javaRoot)) {
      for (const entry of readdirSync(javaRoot)) {
        candidates.push(join(javaRoot, entry));
      }
    }
  }

  return candidates.filter((value, index, values) => value && values.indexOf(value) === index);
}

export function findJavaHome(env = process.env) {
  const executable = process.platform === "win32" ? "java.exe" : "java";
  return javaHomeCandidates(env).find((candidate) => existsSync(join(candidate, "bin", executable)));
}

export function main() {
  const packageJson = readJson(new URL("package.json", root));
  const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
  const missingFiles = requiredFiles.filter((file) => !existsSync(join(rootPath, file)));

  if (missingScripts.length > 0 || missingFiles.length > 0) {
    console.error("Pixel 8 preflight failed: required local QA setup is incomplete.");
    if (missingScripts.length > 0) console.error(`Missing npm scripts: ${missingScripts.join(", ")}`);
    if (missingFiles.length > 0) console.error(`Missing files: ${missingFiles.join(", ")}`);
    process.exit(1);
  }

  const adb = findAdb();
  if (!adb) {
    console.error("Pixel 8 preflight failed: adb is not available on PATH or in standard Android SDK locations.");
    console.error("Install Android platform tools, set ANDROID_HOME or ANDROID_SDK_ROOT, or add platform-tools to PATH.");
    process.exit(2);
  }

  const javaHome = findJavaHome();
  if (!javaHome) {
    console.error("Pixel 8 preflight failed: no Java runtime was found for the Android Gradle build.");
    console.error("Install a JDK, set JAVA_HOME, or install Android Studio with its bundled JBR.");
    process.exit(2);
  }

  const { devices, unavailable } = parseAndroidDevices(adb.result.output);
  if (devices.length === 0 && unavailable.length > 0) {
    console.error("Pixel 8 preflight failed: Android device is connected but not ready for ADB.");
    console.error(`ADB command: ${adb.command}`);
    console.error(`Device states: ${unavailable.join(", ")}`);
    console.error("Accept the USB debugging prompt on the Pixel 8, reconnect USB, or restart ADB, then run this check again.");
    process.exit(3);
  }

  if (devices.length === 0) {
    console.error("Pixel 8 preflight failed: no ADB-visible Android device is connected.");
    console.error(`ADB command: ${adb.command}`);
    console.error("Enable USB debugging on the Pixel 8, connect it over USB, accept the device prompt, then run this check again.");
    process.exit(3);
  }

  console.log("Pixel 8 preflight passed.");
  console.log(`ADB command: ${adb.command}`);
  console.log(`Java home: ${javaHome}`);
  console.log(`ADB-visible Android devices: ${devices.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

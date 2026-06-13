import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

function visibleAndroidDevices(adbOutput) {
  return adbOutput
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line && /\tdevice$/.test(line));
}

const packageJson = readJson(new URL("package.json", root));
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
const missingFiles = requiredFiles.filter((file) => !existsSync(join(rootPath, file)));

if (missingScripts.length > 0 || missingFiles.length > 0) {
  console.error("Pixel 8 preflight failed: required local QA setup is incomplete.");
  if (missingScripts.length > 0) console.error(`Missing npm scripts: ${missingScripts.join(", ")}`);
  if (missingFiles.length > 0) console.error(`Missing files: ${missingFiles.join(", ")}`);
  process.exit(1);
}

const adb = run("adb", ["devices"]);
if (!adb.ok) {
  console.error("Pixel 8 preflight failed: adb is not available on PATH.");
  console.error("Install Android platform tools or start Android Studio, then run this check again.");
  process.exit(2);
}

const devices = visibleAndroidDevices(adb.output);
if (devices.length === 0) {
  console.error("Pixel 8 preflight failed: no ADB-visible Android device is connected.");
  console.error("Enable USB debugging on the Pixel 8, connect it over USB, accept the device prompt, then run this check again.");
  process.exit(3);
}

console.log("Pixel 8 preflight passed.");
console.log(`ADB-visible Android devices: ${devices.length}`);

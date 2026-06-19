import { spawnSync } from "node:child_process";
import { findAdb, readyAndroidDeviceTargets } from "./pixel8-preflight.mjs";

const packageName = "com.anonymous.memorypalace";
const args = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`Usage: npm run pixel8:local-model-qa -- [options]

Options:
  --clear-app-data  Clear ${packageName} before launch. This deletes app sandbox data.
  --skip-install    Skip the standalone APK build/install step.
  --help            Show this help.

The default run is non-destructive: it checks ADB, installs the standalone APK,
launches the app, probes debuggable sandbox visibility when Android allows it,
and prints manual document-picker import steps for Qwen/BGE assets.`);
}

if (args.has("--help")) {
  printHelp();
  process.exit(0);
}

const adb = findAdb();
if (!adb) {
  console.error("Local model QA failed: adb is not available. Run npm run pixel8:preflight for setup details.");
  process.exit(2);
}

const deviceList = spawnSync(adb.command, ["devices", "-l"], { encoding: "utf8" });
const devices = readyAndroidDeviceTargets(deviceList.stdout || adb.result.output);
if (devices.length === 0) {
  console.error("Local model QA failed: no ADB-ready Android device is connected.");
  process.exit(3);
}

const requestedDevice = process.env.PIXEL8_DEVICE_ID;
const selectedDevice = requestedDevice
  ? devices.find((target) => target.serial === requestedDevice || target.name === requestedDevice) ?? devices[0]
  : devices[0];

console.log("Pixel 8 local model QA");
console.log(`ADB command: ${adb.command}`);
console.log(`ADB device: ${selectedDevice.serial}`);
if (requestedDevice && requestedDevice !== selectedDevice.serial && requestedDevice !== selectedDevice.name) {
  console.log(`Requested PIXEL8_DEVICE_ID=${requestedDevice} was not visible; using ${selectedDevice.name}.`);
}

if (!args.has("--skip-install")) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  console.log("Installing standalone APK with npm run pixel8:install-standalone");
  const install = spawnSync(npm, ["run", "pixel8:install-standalone"], {
    env: {
      ...process.env,
      PIXEL8_DEVICE_ID: selectedDevice.serial
    },
    stdio: "inherit"
  });
  if ((install.status ?? 1) !== 0) process.exit(install.status ?? 1);
} else {
  console.log("Skipping standalone APK install because --skip-install was passed.");
}

if (args.has("--clear-app-data")) {
  console.log(`Clearing app data for ${packageName}. This was explicitly requested with --clear-app-data.`);
  const clear = runAdb(["shell", "pm", "clear", packageName]);
  if (!clear.ok) {
    console.error(clear.output || "App data clear failed.");
    process.exit(clear.status);
  }
  console.log(clear.output.trim() || "App data cleared.");
} else {
  console.log("Leaving app data intact. Pass --clear-app-data only for an approved reset/recovery run.");
}

console.log(`Launching ${packageName}`);
const launch = runAdb(["shell", "monkey", "-p", packageName, "1"]);
if (!launch.ok) {
  console.error(launch.output || "App launch failed.");
  process.exit(launch.status);
}
console.log(launch.output.trim());

const pid = runAdb(["shell", "pidof", packageName]);
if (pid.ok && pid.output.trim()) {
  console.log(`Launch check: ${packageName} is running as pid ${pid.output.trim()}.`);
} else {
  console.log("Launch check: app launch command completed, but pidof did not return a running process.");
}

console.log("Checking model files in app sandbox when debuggable run-as access is available.");
const sandbox = runAdb([
  "shell",
  "run-as",
  packageName,
  "sh",
  "-c",
  "find files/models -maxdepth 3 -type f -printf '%p %s bytes\\n' 2>/dev/null || true"
]);

if (sandbox.ok) {
  const output = sandbox.output.trim();
  console.log(output ? `Sandbox model files:\n${output}` : "Sandbox model files: none visible under files/models.");
} else {
  console.log("Sandbox model file check unavailable. This is expected for non-debuggable standalone builds.");
  if (sandbox.output.trim()) console.log(sandbox.output.trim());
}

console.log(`
Manual recovery/quality steps to complete on the Pixel:
1. If this is an approved recovery run, rerun with --clear-app-data, then open Settings.
2. Use Import local model files and select artifacts from C:\\Users\\dnroh\\Documents\\memory-palace-downloads:
   - qwen2.5-0.5b-instruct-q4_k_m.gguf
   - model.onnx
   - tokenizer.json
   - tokenizer_config.json
   - special_tokens_map.json, if present
3. Confirm Settings reports Qwen and BGE ready, then run Test Qwen and Test BGE.
4. Create the golden memories from docs/pixel-8-results/2026-06-19-local-model-recovery-and-quality-plan.md.
5. Verify Qwen suggestions preserve rules tags and filter pronouns, ordinary verbs, and standalone years.
6. Rebuild/search semantic embeddings and record BGE rebuild latency, query latency, result ordering, dimensions, and vector norm.
`);

function runAdb(adbArgs) {
  const result = spawnSync(adb.command, ["-s", selectedDevice.serial, ...adbArgs], { encoding: "utf8" });
  return {
    ok: (result.status ?? 1) === 0,
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`
  };
}

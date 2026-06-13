import { spawnSync } from "node:child_process";
import { delimiter, join } from "node:path";
import { findAdb, findJavaHome, readyAndroidDeviceTargets } from "./pixel8-preflight.mjs";

const adb = findAdb();

if (!adb) {
  console.error("Pixel 8 build failed: adb is not available. Run npm run pixel8:preflight for setup details.");
  process.exit(2);
}

const deviceList = spawnSync(adb.command, ["devices", "-l"], { encoding: "utf8" });
const devices = readyAndroidDeviceTargets(deviceList.stdout || adb.result.output);

if (devices.length === 0) {
  console.error("Pixel 8 build failed: no ADB-ready Android device is connected.");
  process.exit(3);
}

const requestedDevice = process.env.PIXEL8_DEVICE_ID;
const device = requestedDevice ? devices.find((target) => target.serial === requestedDevice || target.name === requestedDevice) : devices[0];
const selectedDevice = device ?? devices[0];
const javaHome = findJavaHome();

if (!javaHome) {
  console.error("Pixel 8 build failed: no Java runtime was found. Run npm run pixel8:preflight for setup details.");
  process.exit(2);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["expo", "run:android", "--device", selectedDevice.name];
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${join(javaHome, "bin")}${delimiter}${process.env.PATH ?? ""}`
};

console.log(`Running ${npx} ${args.join(" ")}`);
console.log(`ADB device: ${selectedDevice.serial}`);
console.log(`Java home: ${javaHome}`);
if (requestedDevice && requestedDevice !== selectedDevice.serial && requestedDevice !== selectedDevice.name) {
  console.log(`Requested PIXEL8_DEVICE_ID=${requestedDevice} was not visible; using ${selectedDevice.name}.`);
}

const result = spawnSync(npx, args, { env, shell: process.platform === "win32", stdio: "inherit" });
process.exit(result.status ?? 1);

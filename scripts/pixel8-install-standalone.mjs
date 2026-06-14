import { spawnSync } from "node:child_process";
import { delimiter, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { findAdb, findJavaHome, readyAndroidDeviceTargets } from "./pixel8-preflight.mjs";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const adb = findAdb();

if (!adb) {
  console.error("Pixel 8 standalone install failed: adb is not available. Run npm run pixel8:preflight for setup details.");
  process.exit(2);
}

const deviceList = spawnSync(adb.command, ["devices", "-l"], { encoding: "utf8" });
const devices = readyAndroidDeviceTargets(deviceList.stdout || adb.result.output);

if (devices.length === 0) {
  console.error("Pixel 8 standalone install failed: no ADB-ready Android device is connected.");
  process.exit(3);
}

const requestedDevice = process.env.PIXEL8_DEVICE_ID;
const device = requestedDevice ? devices.find((target) => target.serial === requestedDevice || target.name === requestedDevice) : devices[0];
const selectedDevice = device ?? devices[0];
const javaHome = findJavaHome();

if (!javaHome) {
  console.error("Pixel 8 standalone install failed: no Java runtime was found. Run npm run pixel8:preflight for setup details.");
  process.exit(2);
}

const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${join(javaHome, "bin")}${delimiter}${process.env.PATH ?? ""}`
};

console.log(`Building standalone APK with ${gradle} :app:assembleRelease`);
console.log(`ADB device: ${selectedDevice.serial}`);
console.log(`Java home: ${javaHome}`);
if (requestedDevice && requestedDevice !== selectedDevice.serial && requestedDevice !== selectedDevice.name) {
  console.log(`Requested PIXEL8_DEVICE_ID=${requestedDevice} was not visible; using ${selectedDevice.name}.`);
}

const build = spawnSync(gradle, [":app:assembleRelease", "--console=plain", "--no-daemon"], {
  cwd: join(rootPath, "android"),
  env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

const apkPath = join(rootPath, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
if (!existsSync(apkPath)) {
  console.error(`Pixel 8 standalone install failed: expected APK was not created at ${apkPath}`);
  process.exit(4);
}

console.log(`Installing ${apkPath}`);
const install = spawnSync(adb.command, ["-s", selectedDevice.serial, "install", "-r", apkPath], {
  encoding: "utf8",
  stdio: "inherit"
});

process.exit(install.status ?? 1);

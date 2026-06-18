import { existsSync, lstatSync, readdirSync, rmSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function parseArgs(argv) {
  const options = {
    dir: ".codex-screenshots",
    yes: false,
    allowDocs: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dir") {
      options.dir = argv[index + 1];
      index += 1;
    } else if (arg === "--yes") {
      options.yes = true;
    } else if (arg === "--allow-docs") {
      options.allowDocs = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.dir) {
    throw new Error("--dir requires a path");
  }

  return options;
}

function usage() {
  return [
    "Usage: npm run screenshots:cleanup -- [--dir .codex-screenshots/<task>] [--yes] [--allow-docs]",
    "",
    "Defaults to dry-run mode. Pass --yes to delete.",
    "By default, only paths under .codex-screenshots are allowed.",
    "Use --allow-docs only for an explicit, reviewed docs screenshot cleanup."
  ].join("\n");
}

function isInside(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative === "" || (!childRelative.startsWith("..") && !isAbsolute(childRelative));
}

function assertSafeTarget(target, allowDocs) {
  if (!isInside(repoRoot, target)) {
    throw new Error(`Refusing to clean outside the repository: ${target}`);
  }

  if (target === repoRoot) {
    throw new Error("Refusing to clean the repository root");
  }

  const relativeTarget = relative(repoRoot, target).replace(/\\/g, "/");
  const inScratchArea = relativeTarget === ".codex-screenshots" || relativeTarget.startsWith(".codex-screenshots/");
  const inDocsArea = relativeTarget === "docs" || relativeTarget.startsWith("docs/");

  if (!inScratchArea && !(allowDocs && inDocsArea)) {
    throw new Error(
      `Refusing to clean ${relativeTarget}. Use .codex-screenshots/<task>, or pass --allow-docs for reviewed docs cleanup.`
    );
  }
}

function collectImages(directory, images = []) {
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    const info = lstatSync(entryPath);

    if (info.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      collectImages(entryPath, images);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    if (imageExtensions.has(extension)) {
      images.push(entryPath);
    }
  }

  return images;
}

function removeEmptyDirectories(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (!entry.isDirectory() || lstatSync(entryPath).isSymbolicLink()) {
      continue;
    }
    removeEmptyDirectories(entryPath);
  }

  if (directory !== repoRoot && readdirSync(directory).length === 0) {
    rmSync(directory, { recursive: false });
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exit(0);
  }

  const target = resolve(repoRoot, options.dir);
  assertSafeTarget(target, options.allowDocs);

  if (!existsSync(target)) {
    console.log(`No screenshot directory found: ${relative(repoRoot, target) || "."}`);
    process.exit(0);
  }

  if (!statSync(target).isDirectory()) {
    throw new Error(`Target is not a directory: ${target}`);
  }

  const images = collectImages(target);
  if (images.length === 0) {
    console.log(`No screenshots found under ${relative(repoRoot, target) || "."}`);
    process.exit(0);
  }

  const action = options.yes ? "Deleting" : "Dry run, would delete";
  console.log(`${action} ${images.length} screenshot(s):`);
  for (const image of images) {
    console.log(`- ${relative(repoRoot, image)}`);
  }

  if (!options.yes) {
    console.log("\nPass --yes to delete these files.");
    process.exit(0);
  }

  for (const image of images) {
    rmSync(image);
  }
  removeEmptyDirectories(target);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage());
  process.exit(1);
}

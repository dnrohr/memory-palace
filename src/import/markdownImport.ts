import type { MemoryArchive } from "../core/archive";
import { schemaVersion } from "../core/schema";
import type { Memory, Tag } from "../core/types";
import type { IImportProvider, ImportArtifact, ImportPreview } from "./contracts";

export class MarkdownImportProvider implements IImportProvider {
  async previewImport(artifacts: ImportArtifact[]): Promise<ImportPreview> {
    const markdownFiles = artifacts.filter((artifact) => artifact.fileName.endsWith(".md"));
    const manifest = parseBundleManifest(artifacts.find((artifact) => artifact.fileName.endsWith("memory-palace-markdown-manifest.json")));
    const now = new Date().toISOString();
    const tagsByName = new Map<string, Tag>();
    const memories: Memory[] = [];
    const memoryTags: MemoryArchive["memoryTags"] = [];
    const warnings: string[] = [];

    for (const artifact of markdownFiles) {
      const parsed = parseMarkdownMemory(artifact, now);
      memories.push(parsed.memory);

      for (const tagName of parsed.tagNames) {
        const normalizedName = tagName.toLocaleLowerCase();
        let tag = tagsByName.get(normalizedName);
        if (!tag) {
          tag = {
            id: `tag_${normalizedName.replace(/[^a-z0-9]+/g, "_")}`,
            name: tagName,
            normalizedName,
            type: "custom",
            createdAt: now,
            updatedAt: now,
            isUserCreated: false
          };
          tagsByName.set(normalizedName, tag);
        }

        memoryTags.push({
          memoryId: parsed.memory.id,
          tagId: tag.id,
          source: "imported",
          userConfirmed: true,
          rejected: false,
          createdAt: now
        });
      }
    }

    const archive: MemoryArchive = {
      exportedAt: now,
      schemaVersion,
      memories,
      tags: [...tagsByName.values()],
      memoryTags,
      people: [],
      pets: [],
      places: [],
      lifePeriods: [],
      processingRuns: []
    };

    const ignoredArtifacts = artifacts.filter(
      (artifact) => !artifact.fileName.endsWith(".md") && !artifact.fileName.endsWith("memory-palace-markdown-manifest.json")
    );
    if (ignoredArtifacts.length > 0) warnings.push("Ignored non-Markdown artifacts.");
    if (manifest) {
      const providedMarkdownNames = new Set(markdownFiles.map((artifact) => artifact.fileName));
      const missingFiles = manifest.files.filter((fileName) => !providedMarkdownNames.has(fileName));
      if (missingFiles.length > 0) warnings.push(`Bundle manifest references ${missingFiles.length} missing Markdown file(s).`);
      if (manifest.memoryCount !== markdownFiles.length) warnings.push("Bundle manifest memory count differs from imported Markdown file count.");
    }

    return {
      archive,
      memoryCount: archive.memories.length,
      tagCount: archive.tags.length,
      warnings
    };
  }
}

type MarkdownBundleManifest = {
  format: "memory-palace.markdown-bundle.v1";
  memoryCount: number;
  files: string[];
};

function parseBundleManifest(artifact: ImportArtifact | undefined): MarkdownBundleManifest | undefined {
  if (!artifact) return undefined;
  try {
    const parsed = JSON.parse(artifact.content) as MarkdownBundleManifest;
    if (parsed.format !== "memory-palace.markdown-bundle.v1") return undefined;
    if (typeof parsed.memoryCount !== "number") return undefined;
    return {
      format: parsed.format,
      memoryCount: parsed.memoryCount,
      files: parsed.files ?? []
    };
  } catch {
    return undefined;
  }
}

function parseMarkdownMemory(artifact: ImportArtifact, now: string): { memory: Memory; tagNames: string[] } {
  const { frontMatter, body } = splitFrontMatter(artifact.content);
  const id = frontMatter.id ?? `mem_${artifact.fileName.replace(/[^a-z0-9]+/gi, "_")}`;
  const title = frontMatter.title ?? titleFromFileName(artifact.fileName);
  const tagNames = frontMatter.tags ?? [];

  return {
    memory: {
      id,
      rawText: body.trim(),
      cleanedText: body.trim(),
      title,
      createdAt: now,
      updatedAt: now,
      sourceType: "import",
      isAudioRetained: false,
      ...(frontMatter.approximate_start_date ? { approximateStartDate: frontMatter.approximate_start_date } : {}),
      ...(frontMatter.approximate_end_date ? { approximateEndDate: frontMatter.approximate_end_date } : {}),
      datePrecision: frontMatter.date_precision ?? "unknown",
      userDateConfirmed: Boolean(frontMatter.approximate_start_date || frontMatter.approximate_end_date)
    },
    tagNames
  };
}

type ParsedFrontMatter = {
  id?: string;
  title?: string;
  source_type?: string;
  date_precision?: Memory["datePrecision"];
  approximate_start_date?: string;
  approximate_end_date?: string;
  tags?: string[];
};

function splitFrontMatter(content: string): { frontMatter: ParsedFrontMatter; body: string } {
  if (!content.startsWith("---\n")) return { frontMatter: {}, body: content };

  const end = content.indexOf("\n---", 4);
  if (end < 0) return { frontMatter: {}, body: content };

  const yaml = content.slice(4, end);
  const body = content.slice(end + 4);
  return { frontMatter: parseSimpleYaml(yaml), body };
}

function parseSimpleYaml(yaml: string): ParsedFrontMatter {
  const result: ParsedFrontMatter = {};
  const lines = yaml.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;

    if (line === "tags:") {
      const tags: string[] = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        tags.push(unquote(lines[index]?.slice(4) ?? ""));
      }
      result.tags = tags;
      continue;
    }

    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator) as keyof ParsedFrontMatter;
    const value = unquote(line.slice(separator + 1).trim());

    if (key === "date_precision") {
      result.date_precision = value as Memory["datePrecision"];
    } else if (key !== "tags") {
      result[key] = value as never;
    }
  }

  return result;
}

function unquote(value: string): string {
  try {
    return JSON.parse(value) as string;
  } catch {
    return value;
  }
}

function titleFromFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop()?.replace(/\.md$/i, "") ?? "Imported memory";
  return baseName.replace(/[-_]+/g, " ").trim() || "Imported memory";
}

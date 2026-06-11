import type { MemoryArchive } from "../core/archive";
import type { Memory, MemoryTag, Tag } from "../core/types";
import type { ExportArtifact, IExportProvider } from "./contracts";

export class MarkdownExportProvider implements IExportProvider {
  async exportArchive(archive: MemoryArchive): Promise<ExportArtifact[]> {
    const tagsById = new Map(archive.tags.map((tag) => [tag.id, tag]));
    const linksByMemory = groupLinksByMemory(archive.memoryTags);

    return archive.memories
      .filter((memory) => !memory.deletedAt)
      .map((memory) => {
        const tags = (linksByMemory.get(memory.id) ?? [])
          .filter((link) => !link.rejected)
          .map((link) => tagsById.get(link.tagId))
          .filter((tag): tag is Tag => Boolean(tag))
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          fileName: `memories/${dateFolder(memory)}/${slugify(memory.title || memory.id)}.md`,
          mediaType: "text/markdown",
          content: renderMemoryMarkdown(memory, tags)
        };
      });
  }
}

function groupLinksByMemory(links: MemoryTag[]): Map<string, MemoryTag[]> {
  const grouped = new Map<string, MemoryTag[]>();

  for (const link of links) {
    const existing = grouped.get(link.memoryId) ?? [];
    existing.push(link);
    grouped.set(link.memoryId, existing);
  }

  return grouped;
}

function renderMemoryMarkdown(memory: Memory, tags: Tag[]): string {
  const frontMatter = [
    "---",
    `id: ${yamlString(memory.id)}`,
    `title: ${yamlString(memory.title ?? memory.id)}`,
    `source_type: ${yamlString(memory.sourceType)}`,
    `date_precision: ${yamlString(memory.datePrecision)}`,
    memory.approximateStartDate ? `approximate_start_date: ${yamlString(memory.approximateStartDate)}` : undefined,
    memory.approximateEndDate ? `approximate_end_date: ${yamlString(memory.approximateEndDate)}` : undefined,
    tags.length > 0 ? "tags:" : undefined,
    ...tags.map((tag) => `  - ${yamlString(tag.name)}`),
    "---",
    "",
    memory.cleanedText || memory.rawText,
    ""
  ].filter((line): line is string => line !== undefined);

  return frontMatter.join("\n");
}

function dateFolder(memory: Memory): string {
  const date = memory.approximateStartDate ?? memory.capturedAt ?? memory.createdAt;
  return date ? date.slice(0, 4) : "unknown-date";
}

function slugify(value: string): string {
  const slug = value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "memory";
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

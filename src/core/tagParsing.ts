export function parseTagNames(tagText: string): string[] {
  return tagText
    .split(/[,;#\n]+|\s{2,}/)
    .map((tag) => tag.trim().replace(/^#+/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " "))
    .filter((tag) => tag.length > 0)
    .map((tag) => tag.toLocaleLowerCase());
}

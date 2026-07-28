const MARKDOWN = /\.(md|markdown)$/i;

export function isMarkdownPath(path: string): boolean {
  return MARKDOWN.test(path.trim());
}

export function pickMarkdown(paths: string[]): string | null {
  return paths.find(isMarkdownPath) ?? null;
}

export function fileNameOf(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

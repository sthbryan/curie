import { isValidSkillName } from "./skillName";

export const REQUIRED_FIELDS = ["name", "description"] as const;

export type FrontmatterCheck =
  | { ok: true; name: string }
  | { ok: false; reason: "block" }
  | { ok: false; reason: "fields"; missing: string[] }
  | { ok: false; reason: "name"; name: string };

function fieldValue(block: string, field: string): string | null {
  const match = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, "m").exec(block);
  if (!match) return null;
  const value = match[1]
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  return value.length > 0 ? value : null;
}

export function checkFrontmatter(content: string): FrontmatterCheck {
  const text = content.trim();
  if (!text.startsWith("---")) return { ok: false, reason: "block" };

  const closing = text.indexOf("\n---", 3);
  if (closing === -1) return { ok: false, reason: "block" };

  const block = text.slice(3, closing);
  const missing = REQUIRED_FIELDS.filter((field) => fieldValue(block, field) === null);
  if (missing.length > 0) return { ok: false, reason: "fields", missing };

  const name = fieldValue(block, "name") as string;
  if (!isValidSkillName(name)) return { ok: false, reason: "name", name };

  return { ok: true, name };
}

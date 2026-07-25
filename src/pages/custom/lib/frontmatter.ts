export const REQUIRED_FIELDS = ["name", "description"] as const;

export type FrontmatterCheck =
  | { ok: true }
  | { ok: false; reason: "block" }
  | { ok: false; reason: "fields"; missing: string[] };

export function checkFrontmatter(content: string): FrontmatterCheck {
  const text = content.trim();
  if (!text.startsWith("---")) return { ok: false, reason: "block" };

  const closing = text.indexOf("\n---", 3);
  if (closing === -1) return { ok: false, reason: "block" };

  const block = text.slice(3, closing);
  const missing = REQUIRED_FIELDS.filter(
    (field) => !new RegExp(`^\\s*${field}\\s*:\\s*\\S`, "m").test(block),
  );

  return missing.length === 0 ? { ok: true } : { ok: false, reason: "fields", missing };
}

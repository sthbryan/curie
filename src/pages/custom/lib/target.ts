export type InstallTarget = "url" | "package";

export function classifyTarget(input: string): InstallTarget | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return "url";
  if (/^git@/i.test(v)) return "url";
  if (/^ssh:\/\//i.test(v)) return "url";
  if (/^[\w.-]+\/[\w.-]+(@[\w.-]+)?$/.test(v)) return "package";
  return null;
}

export function targetLabel(input: string): string {
  const v = input.trim();
  const urlMatch = v.match(
    /(?:https?:\/\/|git@|ssh:\/\/)[^/]+\/([^/?#]+)\/([^/?#]+?)(?:\.git)?(?:\/.*)?$/i,
  );
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;
  const pkgMatch = v.match(/^([\w.-]+)\/([\w.-]+?)(?:@([\w.-]+))?$/);
  if (pkgMatch) {
    if (pkgMatch[3]) return `${pkgMatch[1]}/${pkgMatch[2]} · ${pkgMatch[3]}`;
    return `${pkgMatch[1]}/${pkgMatch[2]}`;
  }
  return v;
}

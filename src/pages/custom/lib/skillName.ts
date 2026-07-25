const MAX_LENGTH = 64;

export function slugifySkillName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, MAX_LENGTH);
}

export function isValidSkillName(name: string): boolean {
  if (!name) return false;
  if (name.length > MAX_LENGTH) return false;
  if (/^[-._]/.test(name)) return false;
  return /^[A-Za-z0-9._-]+$/.test(name);
}

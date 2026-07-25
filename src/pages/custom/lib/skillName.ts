const MAX_LENGTH = 64;

export function isValidSkillName(name: string): boolean {
  if (!name) return false;
  if (name.length > MAX_LENGTH) return false;
  if (/^[-._]/.test(name)) return false;
  return /^[A-Za-z0-9._-]+$/.test(name);
}

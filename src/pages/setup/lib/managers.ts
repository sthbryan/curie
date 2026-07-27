const LABELS: Record<string, string> = {
  volta: "Volta",
  fnm: "fnm",
  nvm: "nvm",
  mise: "mise",
  asdf: "asdf",
  homebrew: "Homebrew",
  system: "your system",
};

export const FALLBACK_MANAGER = "Volta";

export function managerLabel(id: string | null | undefined): string {
  if (!id) return FALLBACK_MANAGER;
  return LABELS[id] ?? id;
}

import type { SkillInfo } from "@/components/types";

export function skillFixture(
  name: string,
  agents: string[],
  overrides: Partial<SkillInfo> = {},
): SkillInfo {
  return {
    name,
    path: `/skills/${name}`,
    scope: "global",
    agents,
    source: `me/${name}`,
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

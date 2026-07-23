import { beforeEach, describe, expect, it } from "vitest";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";
import {
  setSkills,
  setSkillsError,
  setSkillsLoading,
  setSkillUpdates,
  setUpdatesError,
  setUpdatesLoading,
  skills,
  skillsError,
  skillsLoading,
  skillUpdates,
  updatesError,
  updatesLoading,
} from "@/store/skills";

const sample: SkillInfo[] = [
  {
    name: "impeccable",
    path: "/a/impeccable",
    scope: "global",
    agents: ["Codex"],
    source: "pbakaus/impeccable",
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: null,
  },
];

const sampleUpdates: SkillUpdateInfo[] = [
  {
    name: "impeccable",
    source: "pbakaus/impeccable",
    updateAvailable: true,
    checkable: true,
  },
];

beforeEach(() => {
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
});

describe("skills store (signals)", () => {
  it("starts empty and idle", () => {
    expect(skills.value).toEqual([]);
    expect(skillsLoading.value).toBe(false);
    expect(skillsError.value).toBeNull();
    expect(skillUpdates.value).toEqual([]);
    expect(updatesLoading.value).toBe(false);
    expect(updatesError.value).toBeNull();
  });

  it("setSkills replaces skills and clears any prior error", () => {
    setSkillsError("boom");
    setSkills(sample);
    expect(skills.value).toBe(sample);
    expect(skillsError.value).toBeNull();
  });

  it("setSkillsLoading toggles the loading flag", () => {
    setSkillsLoading(true);
    expect(skillsLoading.value).toBe(true);
  });

  it("setSkillsError records an error", () => {
    setSkillsError("list_skills failed");
    expect(skillsError.value).toBe("list_skills failed");
  });

  it("setSkillUpdates replaces updates and clears any prior error", () => {
    setUpdatesError("boom");
    setSkillUpdates(sampleUpdates);
    expect(skillUpdates.value).toBe(sampleUpdates);
    expect(updatesError.value).toBeNull();
  });

  it("setUpdatesLoading and setUpdatesError work as expected", () => {
    setUpdatesLoading(true);
    setUpdatesError("check failed");
    expect(updatesLoading.value).toBe(true);
    expect(updatesError.value).toBe("check failed");
  });
});

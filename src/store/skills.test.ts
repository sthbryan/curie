import { beforeEach, describe, expect, it } from "vitest";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";
import { useSkillsStore } from "./skills";

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
  useSkillsStore.setState({
    skills: [],
    skillsLoading: false,
    skillsError: null,
    skillUpdates: [],
    updatesLoading: false,
    updatesError: null,
  });
});

describe("useSkillsStore", () => {
  it("starts empty and idle", () => {
    const s = useSkillsStore.getState();
    expect(s.skills).toEqual([]);
    expect(s.skillsLoading).toBe(false);
    expect(s.skillsError).toBeNull();
    expect(s.skillUpdates).toEqual([]);
    expect(s.updatesLoading).toBe(false);
    expect(s.updatesError).toBeNull();
  });

  it("setSkills replaces skills and clears any prior error", () => {
    useSkillsStore.getState().setSkillsError("boom");
    useSkillsStore.getState().setSkills(sample);
    const s = useSkillsStore.getState();
    expect(s.skills).toBe(sample);
    expect(s.skillsError).toBeNull();
  });

  it("setSkillsLoading toggles the loading flag", () => {
    useSkillsStore.getState().setSkillsLoading(true);
    expect(useSkillsStore.getState().skillsLoading).toBe(true);
  });

  it("setSkillsError records an error", () => {
    useSkillsStore.getState().setSkillsError("list_skills failed");
    expect(useSkillsStore.getState().skillsError).toBe("list_skills failed");
  });

  it("setSkillUpdates replaces updates and clears any prior error", () => {
    useSkillsStore.getState().setUpdatesError("boom");
    useSkillsStore.getState().setSkillUpdates(sampleUpdates);
    const s = useSkillsStore.getState();
    expect(s.skillUpdates).toBe(sampleUpdates);
    expect(s.updatesError).toBeNull();
  });

  it("setUpdatesLoading and setUpdatesError work as expected", () => {
    useSkillsStore.getState().setUpdatesLoading(true);
    useSkillsStore.getState().setUpdatesError("check failed");
    const s = useSkillsStore.getState();
    expect(s.updatesLoading).toBe(true);
    expect(s.updatesError).toBe("check failed");
  });
});

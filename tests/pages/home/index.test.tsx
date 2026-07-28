// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  skills,
  skillsError,
  skillsLoading,
  skillUpdates,
  updatesError,
  updatesLoading,
} from "@/store/skills";
import { lang } from "@/store/system";
import { skillFixture } from "./fixtures";
import { cleanup, mount, text } from "./mount";

const loadSkillsMock = vi.fn().mockResolvedValue(undefined);
const checkSkillUpdatesMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/boot", () => ({
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
  checkSkillUpdates: (...args: unknown[]) => checkSkillUpdatesMock(...args),
}));

const { Home } = await import("@/pages/home/index");

afterEach(cleanup);
beforeEach(() => {
  loadSkillsMock.mockClear();
  checkSkillUpdatesMock.mockClear();
  lang.value = "en";
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
});

describe("Home", () => {
  it("shows the loading screen while the first load runs", () => {
    skillsLoading.value = true;
    expect(text(mount(<Home />))).toMatch(/loading|cargando/i);
  });

  it("shows the error screen when the first load fails", () => {
    skillsError.value = "boom";
    expect(text(mount(<Home />))).toContain("boom");
  });

  it("keeps rendering the dashboard when a later load fails", () => {
    skills.value = [skillFixture("impeccable", ["Codex"])];
    skillsError.value = "boom";
    expect(text(mount(<Home />))).toContain("impeccable");
  });

  it("renders the overview, the cards and the actions", () => {
    skills.value = [
      skillFixture("impeccable", ["Claude Code", "Codex"]),
      skillFixture("find-skills", ["Codex"]),
    ];
    skillUpdates.value = [
      { name: "impeccable", source: "me/impeccable", updateAvailable: true, checkable: true },
    ];

    const el = mount(<Home />);
    const body = text(el);
    expect(body).toContain("HOME · OVERVIEW");
    expect(body).toContain("Your skills at a glance");
    expect(body).toMatch(/2\s*SKILLS/);
    expect(body).toContain("impeccable");
    expect(body).toContain("Codex");
  });

  it("explains the empty state instead of showing counts", () => {
    const body = text(mount(<Home />));
    expect(body).toContain("No global skills installed yet");
    expect(body).not.toMatch(/0\s*SKILLS/);
  });
});

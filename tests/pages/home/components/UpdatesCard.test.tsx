// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillUpdateInfo } from "@/components/types";
import { skills, skillUpdates, updatesError, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";
import { skillFixture } from "../fixtures";
import { cleanup, click, mount, text } from "../mount";

const checkSkillUpdatesMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/boot", () => ({
  checkSkillUpdates: (...args: unknown[]) => checkSkillUpdatesMock(...args),
  loadSkills: vi.fn(),
}));

const { UpdatesCard } = await import("@/pages/home/components/UpdatesCard");

const outdated = (name: string): SkillUpdateInfo => ({
  name,
  source: `me/${name}`,
  updateAvailable: true,
  checkable: true,
});

afterEach(cleanup);
beforeEach(() => {
  checkSkillUpdatesMock.mockClear();
  lang.value = "en";
  skills.value = [];
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
});

describe("UpdatesCard", () => {
  it("reports a failed check", () => {
    updatesError.value = "network down";
    const el = mount(<UpdatesCard />);
    expect(text(el)).toContain("Could not check for skill updates");
  });

  it("pulses while the first check runs", () => {
    updatesLoading.value = true;
    const el = mount(<UpdatesCard />);
    expect(el.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("says everything is current when nothing is outdated", () => {
    skills.value = [skillFixture("a", ["Codex"])];
    skillUpdates.value = [{ ...outdated("a"), updateAvailable: false }];
    const el = mount(<UpdatesCard />);
    expect(text(el)).toContain("All checkable skills are up to date");
  });

  it("caps the list and links the rest to the skills page", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g"];
    skills.value = names.map((name) => skillFixture(name, ["Codex"]));
    skillUpdates.value = names.map(outdated);

    const el = mount(<UpdatesCard />);
    expect(text(el)).toContain("a");
    expect(text(el)).toContain("e");
    expect(text(el)).not.toContain("me/f");
    expect(text(el)).toContain("+2 MORE");
  });

  it("runs a check when the button is pressed", () => {
    const el = mount(<UpdatesCard />);
    click(el.querySelector("button"));
    expect(checkSkillUpdatesMock).toHaveBeenCalledTimes(1);
  });

  it("disables the button while a check is running", () => {
    updatesLoading.value = true;
    const el = mount(<UpdatesCard />);
    expect(el.querySelector("button")?.hasAttribute("disabled")).toBe(true);
  });
});

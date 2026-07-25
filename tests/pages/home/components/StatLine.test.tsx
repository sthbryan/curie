// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StatLine } from "@/pages/home/components/StatLine";
import { skills, skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";
import { skillFixture } from "../fixtures";
import { cleanup, mount, text } from "../mount";

afterEach(cleanup);
beforeEach(() => {
  lang.value = "en";
  skills.value = [];
  skillUpdates.value = [];
  updatesLoading.value = false;
});

describe("StatLine", () => {
  it("counts skills, tools and updates on one line", () => {
    skills.value = [skillFixture("a", ["Codex"]), skillFixture("b", ["Codex", "Zed"])];
    skillUpdates.value = [
      { name: "a", source: "me/a", updateAvailable: true, checkable: true },
      { name: "b", source: "me/b", updateAvailable: false, checkable: true },
    ];

    const el = mount(<StatLine />);
    expect(text(el)).toMatch(/2\s*SKILLS/);
    expect(text(el)).toMatch(/2\s*AI TOOLS/);
    expect(text(el)).toMatch(/1\s*UPDATES/);
  });

  it("pulses the update count while the first check is in flight", () => {
    updatesLoading.value = true;
    const el = mount(<StatLine />);
    expect(el.querySelectorAll(".animate-pulse")).toHaveLength(1);
  });

  it("stops pulsing once results are in", () => {
    updatesLoading.value = true;
    skillUpdates.value = [{ name: "a", source: null, updateAvailable: false, checkable: true }];
    const el = mount(<StatLine />);
    expect(el.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });
});

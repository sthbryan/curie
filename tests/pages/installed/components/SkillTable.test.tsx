// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentFilter, query, sortDir, sortKey } from "@/pages/installed/store/store";
import { skills, skillUpdates } from "@/store/skills";
import { lang } from "@/store/system";
import { cleanup, click, mount, skillFixture, text } from "../mount";

vi.mock("@/lib/boot", () => ({
  loadSkills: vi.fn(),
  checkSkillUpdates: vi.fn(),
}));

const { SkillTable } = await import("@/pages/installed/components/SkillTable");

afterEach(cleanup);
beforeEach(() => {
  lang.value = "en";
  query.value = "";
  agentFilter.value = null;
  sortKey.value = "name";
  sortDir.value = "asc";
  skillUpdates.value = [];
  skills.value = [
    skillFixture("alpha", ["Codex", "Zed", "Pi"]),
    skillFixture("beta", ["Codex"]),
  ];
});

const noop = () => {};

describe("SkillTable", () => {
  it("renders a row per visible skill", () => {
    const el = mount(<SkillTable onAskRemove={noop} />);
    expect(el.querySelectorAll("article").length).toBe(2);
    expect(text(el)).toContain("alpha");
    expect(text(el)).toContain("/skills/beta");
  });

  it("collapses the tool column", () => {
    const el = mount(<SkillTable onAskRemove={noop} />);
    expect(text(el)).toContain("+1");
    expect(text(el)).not.toContain("Pi");
  });

  it("marks the outdated row with the accent timestamp", () => {
    skillUpdates.value = [
      { name: "alpha", source: "me/alpha", updateAvailable: true, checkable: true, checked: true },
    ];
    const el = mount(<SkillTable onAskRemove={noop} />);
    expect(el.querySelector(".text-accent")).not.toBeNull();
  });

  it("only offers the update button on outdated rows", () => {
    const before = mount(<SkillTable onAskRemove={noop} />).querySelectorAll("button").length;

    cleanup();
    skillUpdates.value = [
      { name: "alpha", source: "me/alpha", updateAvailable: true, checkable: true, checked: true },
    ];
    const after = mount(<SkillTable onAskRemove={noop} />).querySelectorAll("button").length;
    expect(after).toBe(before + 1);
  });

  it("asks before removing instead of removing straight away", () => {
    const asked: string[] = [];
    const el = mount(<SkillTable onAskRemove={(name) => asked.push(name)} />);
    const remove = Array.from(el.querySelectorAll("button")).filter(
      (b) => b.getAttribute("aria-label") === "REMOVE",
    );
    click(remove[0]);
    expect(asked).toEqual(["alpha"]);
  });

  it("drives the store when a header is clicked", () => {
    const el = mount(<SkillTable onAskRemove={noop} />);
    const header = Array.from(el.querySelectorAll("button")).find((b) =>
      b.getAttribute("aria-label")?.startsWith("NAME"),
    );
    click(header);
    expect(sortKey.value).toBe("name");
    expect(sortDir.value).toBe("desc");
  });

  it("reflects the sorted order from the store", () => {
    sortDir.value = "desc";
    const el = mount(<SkillTable onAskRemove={noop} />);
    const names = Array.from(el.querySelectorAll("article")).map(
      (row) => row.querySelector("span")?.textContent,
    );
    expect(names).toEqual(["beta", "alpha"]);
  });

  it("narrows the rows with the active query", () => {
    query.value = "beta";
    const el = mount(<SkillTable onAskRemove={noop} />);
    expect(el.querySelectorAll("article").length).toBe(1);
    expect(text(el)).toContain("beta");
  });
});

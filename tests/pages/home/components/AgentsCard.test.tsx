// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AgentsCard } from "@/pages/home/components/AgentsCard";
import { skills } from "@/store/skills";
import { lang } from "@/store/system";
import { skillFixture } from "../fixtures";
import { cleanup, mount, text } from "../mount";

afterEach(cleanup);
beforeEach(() => {
  lang.value = "en";
  skills.value = [];
});

describe("AgentsCard", () => {
  it("shows the empty note with no skills", () => {
    const el = mount(<AgentsCard />);
    expect(text(el)).toContain("No global skills installed yet");
  });

  it("drops the bars when every tool holds the same count", () => {
    skills.value = [skillFixture("a", ["Codex", "Zed"]), skillFixture("b", ["Codex", "Zed"])];
    const el = mount(<AgentsCard />);
    expect(text(el)).toContain("Codex");
    expect(text(el)).toContain("Zed");
    expect(el.querySelectorAll(".animate-bar-grow")).toHaveLength(0);
  });

  it("draws a bar per tool when the counts differ", () => {
    skills.value = [skillFixture("a", ["Codex", "Zed"]), skillFixture("b", ["Codex"])];
    const el = mount(<AgentsCard />);
    const bars = el.querySelectorAll<HTMLElement>(".animate-bar-grow");
    expect(bars).toHaveLength(2);
    expect(bars[0].style.transform).toBe("scaleX(1)");
    expect(bars[1].style.transform).toBe("scaleX(0.5)");
  });

  it("caps the bar list and links the rest to the skills page", () => {
    const tools = ["A", "B", "C", "D", "E", "F"];
    skills.value = [
      skillFixture("wide", tools),
      ...tools.slice(0, 5).map((tool, i) => skillFixture(`s${i}`, [tool])),
    ];
    const el = mount(<AgentsCard />);
    expect(el.querySelectorAll(".animate-bar-grow")).toHaveLength(5);
    expect(text(el)).toContain("+1 MORE");
  });
});

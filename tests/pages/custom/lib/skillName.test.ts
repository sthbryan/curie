import { describe, expect, it } from "vitest";
import { isValidSkillName, slugifySkillName } from "@/pages/custom/lib/skillName";

describe("slugifySkillName", () => {
  it("drops the .md extension and lowercases", () => {
    expect(slugifySkillName("My Skill.md")).toBe("my-skill");
  });

  it("collapses unsupported characters into dashes", () => {
    expect(slugifySkillName("code review (v2).md")).toBe("code-review-v2");
  });

  it("trims leading and trailing separators", () => {
    expect(slugifySkillName("--weird--.md")).toBe("weird");
  });

  it("caps the length at 64 characters", () => {
    expect(slugifySkillName(`${"a".repeat(80)}.md`)).toHaveLength(64);
  });
});

describe("isValidSkillName", () => {
  it("accepts letters, digits, dashes, dots and underscores", () => {
    expect(isValidSkillName("my-skill")).toBe(true);
    expect(isValidSkillName("my_skill.v2")).toBe(true);
  });

  it("rejects empty, over-long, separator-prefixed and spaced names", () => {
    expect(isValidSkillName("")).toBe(false);
    expect(isValidSkillName("a".repeat(65))).toBe(false);
    expect(isValidSkillName("-skill")).toBe(false);
    expect(isValidSkillName("my skill")).toBe(false);
  });
});

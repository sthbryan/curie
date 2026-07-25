import { describe, expect, it } from "vitest";
import { isValidSkillName } from "@/pages/custom/lib/skillName";

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

  it("rejects a name that would escape the skills directory", () => {
    expect(isValidSkillName("../bad")).toBe(false);
    expect(isValidSkillName("slash/here")).toBe(false);
    expect(isValidSkillName(".hidden")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { checkFrontmatter } from "@/pages/custom/lib/frontmatter";

const valid = ["---", "name: my-skill", "description: what it does", "---", "", "# Body"].join("\n");

describe("checkFrontmatter", () => {
  it("returns the skill name from a complete block", () => {
    expect(checkFrontmatter(valid)).toEqual({ ok: true, name: "my-skill" });
  });

  it("tolerates blank lines, quotes and extra spacing around the name", () => {
    expect(checkFrontmatter(`\n\n${valid}\n`)).toEqual({ ok: true, name: "my-skill" });
    expect(
      checkFrontmatter('---\nname:   "my-skill"  \ndescription: x\n---\n# Body'),
    ).toEqual({ ok: true, name: "my-skill" });
  });

  it("reports a body with no frontmatter at all", () => {
    expect(checkFrontmatter("# Just a heading")).toEqual({ ok: false, reason: "block" });
  });

  it("reports an unterminated block", () => {
    expect(checkFrontmatter("---\nname: my-skill\ndescription: x")).toEqual({
      ok: false,
      reason: "block",
    });
  });

  it("lists the missing fields", () => {
    expect(checkFrontmatter("---\nname: my-skill\n---\n# Body")).toEqual({
      ok: false,
      reason: "fields",
      missing: ["description"],
    });
    expect(checkFrontmatter("---\nfoo: bar\n---\n# Body")).toEqual({
      ok: false,
      reason: "fields",
      missing: ["name", "description"],
    });
  });

  it("treats a declared but empty field as missing", () => {
    expect(checkFrontmatter("---\nname: my-skill\ndescription:\n---\n# Body")).toEqual({
      ok: false,
      reason: "fields",
      missing: ["description"],
    });
  });

  it("rejects a name that cannot be a directory", () => {
    expect(checkFrontmatter("---\nname: my skill\ndescription: x\n---\n# Body")).toEqual({
      ok: false,
      reason: "name",
      name: "my skill",
    });
    expect(checkFrontmatter("---\nname: ../escape\ndescription: x\n---\n# Body")).toEqual({
      ok: false,
      reason: "name",
      name: "../escape",
    });
  });
});

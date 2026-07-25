import { describe, expect, it } from "vitest";
import { checkFrontmatter } from "@/pages/custom/lib/frontmatter";

const valid = ["---", "name: my-skill", "description: what it does", "---", "", "# Body"].join("\n");

describe("checkFrontmatter", () => {
  it("accepts a block with both required fields", () => {
    expect(checkFrontmatter(valid)).toEqual({ ok: true });
  });

  it("accepts leading blank lines around the block", () => {
    expect(checkFrontmatter(`\n\n${valid}\n`)).toEqual({ ok: true });
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
});

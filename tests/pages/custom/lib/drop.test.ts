import { describe, expect, it } from "vitest";
import { fileNameOf, isMarkdownPath, pickMarkdown } from "@/pages/custom/lib/drop";

describe("isMarkdownPath", () => {
  it("accepts md and markdown in any case", () => {
    expect(isMarkdownPath("/tmp/SKILL.md")).toBe(true);
    expect(isMarkdownPath("/tmp/SKILL.MD")).toBe(true);
    expect(isMarkdownPath("/tmp/notes.markdown")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isMarkdownPath("/tmp/skill.txt")).toBe(false);
    expect(isMarkdownPath("/tmp/skill.md.zip")).toBe(false);
    expect(isMarkdownPath("/tmp/markdown")).toBe(false);
    expect(isMarkdownPath("")).toBe(false);
  });
});

describe("pickMarkdown", () => {
  it("takes the first markdown file of the drop", () => {
    expect(pickMarkdown(["/tmp/a.txt", "/tmp/b.md", "/tmp/c.md"])).toBe("/tmp/b.md");
  });

  it("returns null when nothing dropped is markdown", () => {
    expect(pickMarkdown(["/tmp/a.txt", "/tmp/b.png"])).toBeNull();
    expect(pickMarkdown([])).toBeNull();
  });
});

describe("fileNameOf", () => {
  it("takes the last segment of a posix or windows path", () => {
    expect(fileNameOf("/home/me/skills/SKILL.md")).toBe("SKILL.md");
    expect(fileNameOf("C:\\Users\\me\\SKILL.md")).toBe("SKILL.md");
    expect(fileNameOf("SKILL.md")).toBe("SKILL.md");
  });
});

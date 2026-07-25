import { describe, expect, it } from "vitest";
import { classifyTarget, targetLabel } from "@/pages/custom/lib/target";

describe("classifyTarget", () => {
  it("returns null for empty input", () => {
    expect(classifyTarget("")).toBeNull();
    expect(classifyTarget("   ")).toBeNull();
  });

  it("classifies https and http URLs", () => {
    expect(classifyTarget("https://github.com/owner/repo")).toBe("url");
    expect(classifyTarget("http://github.com/owner/repo")).toBe("url");
  });

  it("classifies git and ssh URLs", () => {
    expect(classifyTarget("git@github.com:owner/repo.git")).toBe("url");
    expect(classifyTarget("ssh://git@github.com/owner/repo")).toBe("url");
  });

  it("classifies owner/repo packages", () => {
    expect(classifyTarget("owner/repo")).toBe("package");
    expect(classifyTarget("owner/repo@skill")).toBe("package");
    expect(classifyTarget("vercel-labs/agent-skills")).toBe("package");
  });

  it("rejects garbage", () => {
    expect(classifyTarget("not a url")).toBeNull();
    expect(classifyTarget("just-text")).toBeNull();
  });
});

describe("targetLabel", () => {
  it("reduces a github URL to owner/repo", () => {
    expect(targetLabel("https://github.com/MiniMax-AI/skills")).toBe("MiniMax-AI/skills");
    expect(targetLabel("https://github.com/owner/repo.git")).toBe("owner/repo");
    expect(targetLabel("https://github.com/owner/repo/tree/main/skills")).toBe("owner/repo");
  });

  it("keeps a package handle and shows its skill reference", () => {
    expect(targetLabel("owner/repo")).toBe("owner/repo");
    expect(targetLabel("owner/repo@pdf")).toBe("owner/repo · pdf");
  });

  it("falls back to the raw input", () => {
    expect(targetLabel("  whatever  ")).toBe("whatever");
  });
});

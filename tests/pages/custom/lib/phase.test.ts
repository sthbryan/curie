import { describe, expect, it } from "vitest";
import type { SkillDetection } from "@/components/types";
import type { DetectionState } from "@/pages/custom/hooks/useSkillDetection";
import { isPending, resolvePhase } from "@/pages/custom/lib/phase";

const detected: SkillDetection = {
  isSkill: true,
  total: 1,
  truncated: false,
  skills: [{ name: "pdf", description: "pdf things" }],
  refUsed: null,
};

const ok: DetectionState = { kind: "ok", detection: detected };

describe("resolvePhase", () => {
  it("reports installing above everything else", () => {
    expect(resolvePhase("owner/repo", true, ok)).toBe("installing");
    expect(resolvePhase("", true, { kind: "idle" })).toBe("installing");
  });

  it("reports empty for blank input", () => {
    expect(resolvePhase("", false, { kind: "idle" })).toBe("empty");
    expect(resolvePhase("   ", false, { kind: "idle" })).toBe("empty");
  });

  it("reports invalid for input that is not a target", () => {
    expect(resolvePhase("not a url", false, { kind: "idle" })).toBe("invalid");
  });

  it("reports checking while detection is idle or in flight", () => {
    expect(resolvePhase("owner/repo", false, { kind: "idle" })).toBe("checking");
    expect(resolvePhase("owner/repo", false, { kind: "checking" })).toBe("checking");
  });

  it("maps each detection outcome", () => {
    expect(resolvePhase("owner/repo", false, ok)).toBe("ready");
    expect(resolvePhase("owner/repo", false, { kind: "empty" })).toBe("noSkills");
    expect(resolvePhase("owner/repo", false, { kind: "error", message: "boom" })).toBe(
      "checkFailed",
    );
  });
});

describe("isPending", () => {
  it("is true only while checking or installing", () => {
    expect(isPending("checking")).toBe(true);
    expect(isPending("installing")).toBe(true);
    expect(isPending("ready")).toBe(false);
    expect(isPending("empty")).toBe(false);
    expect(isPending("invalid")).toBe(false);
    expect(isPending("noSkills")).toBe(false);
    expect(isPending("checkFailed")).toBe(false);
  });
});

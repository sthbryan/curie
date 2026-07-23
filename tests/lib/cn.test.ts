import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps custom font-size together with theme text color", () => {
    expect(cn("text-micro", "text-fg-3")).toBe("text-micro text-fg-3");
    expect(cn("text-fg-3", "text-micro")).toBe("text-fg-3 text-micro");
    expect(cn("font-mono tracking-label text-fg-3", "text-micro")).toBe(
      "font-mono tracking-label text-fg-3 text-micro",
    );
  });

  it("keeps text-mono size with accent color", () => {
    expect(cn("text-mono text-accent")).toBe("text-mono text-accent");
    expect(cn("text-accent", "text-mono")).toBe("text-accent text-mono");
  });

  it("lets a later font-size override an earlier one", () => {
    expect(cn("text-micro", "text-mono")).toBe("text-mono");
    expect(cn("text-mono", "text-micro")).toBe("text-micro");
  });

  it("lets a later text color override an earlier one", () => {
    expect(cn("text-fg-3", "text-accent")).toBe("text-accent");
    expect(cn("text-accent", "text-fg-4")).toBe("text-fg-4");
  });

  it("keeps tracking-label with other utilities", () => {
    expect(cn("tracking-label", "text-micro", "text-fg-3")).toBe(
      "tracking-label text-micro text-fg-3",
    );
  });
});

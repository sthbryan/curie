import { describe, expect, it } from "vitest";
import { duration, easeOut, fadeUp, pageAnim } from "@/lib/motion";

describe("motion tokens", () => {
  it("exposes ordered duration values", () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it("easeOut is a css cubic bezier", () => {
    expect(easeOut).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  });

  it("pageAnim tags the element for the page keyframes", () => {
    expect(pageAnim["data-anim"]).toBe("page");
  });

  it("fadeUp tags the element and defaults to no delay", () => {
    expect(fadeUp()).toEqual({
      "data-anim": "fade-up",
      style: { "--anim-delay": "0ms" },
    });
  });

  it("fadeUp converts a seconds delay into a css duration", () => {
    expect(fadeUp(0.08).style).toEqual({ "--anim-delay": "80ms" });
  });
});

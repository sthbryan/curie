import { describe, expect, it } from "vitest";
import { duration, easeOut, fadeUp, pageTransition } from "@/lib/motion";

describe("motion constants", () => {
  it("exposes ordered duration values", () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it("easeOut is a 4-tuple cubic bezier", () => {
    expect(easeOut).toEqual([0.22, 1, 0.36, 1]);
  });

  it("pageTransition drives opacity and y", () => {
    expect(pageTransition.initial).toEqual({ opacity: 0, y: 6 });
    expect(pageTransition.animate).toMatchObject({ opacity: 1, y: 0 });
    expect(pageTransition.exit).toMatchObject({ opacity: 0, y: -3, pointerEvents: "none" });
  });

  it("pageTransition leaves faster than it enters", () => {
    expect(pageTransition.animate.transition).toMatchObject({
      duration: duration.base,
      ease: easeOut,
    });
    expect(pageTransition.exit.transition.duration).toBeLessThan(duration.base);
  });

  it("fadeUp returns a variant with the given delay", () => {
    const v = fadeUp(0.5);
    expect(v.initial).toEqual({ opacity: 0, y: 10 });
    expect(v.animate).toEqual({ opacity: 1, y: 0 });
    expect(v.transition).toMatchObject({ delay: 0.5 });
  });
});

import { describe, expect, it } from "vitest";
import { duration, easeOut, fadeUp, pageTransition, toMotionReducedMotion } from "./motion";

describe("toMotionReducedMotion", () => {
  it("maps 'true' to 'always'", () => {
    expect(toMotionReducedMotion("true")).toBe("always");
  });

  it("maps 'false' to 'never'", () => {
    expect(toMotionReducedMotion("false")).toBe("never");
  });

  it("maps 'system' to 'user'", () => {
    expect(toMotionReducedMotion("system")).toBe("user");
  });
});

describe("motion constants", () => {
  it("exposes ordered duration values", () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it("easeOut is a 4-tuple cubic bezier", () => {
    expect(easeOut).toEqual([0.22, 1, 0.36, 1]);
  });

  it("pageTransition drives opacity and y", () => {
    expect(pageTransition.initial).toEqual({ opacity: 0, y: 8 });
    expect(pageTransition.animate).toEqual({ opacity: 1, y: 0 });
    expect(pageTransition.exit).toEqual({ opacity: 0, y: -4 });
  });

  it("fadeUp returns a variant with the given delay", () => {
    const v = fadeUp(0.5);
    expect(v.initial).toEqual({ opacity: 0, y: 10 });
    expect(v.animate).toEqual({ opacity: 1, y: 0 });
    expect(v.transition).toMatchObject({ delay: 0.5 });
  });
});

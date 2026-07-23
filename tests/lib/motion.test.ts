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

  it("pageTransition drives opacity, y, and scale", () => {
    expect(pageTransition.initial).toEqual({ opacity: 0, y: 12, scale: 0.99 });
    expect(pageTransition.animate).toEqual({ opacity: 1, y: 0, scale: 1 });
    expect(pageTransition.exit).toEqual({ opacity: 0, y: -6, scale: 1.005 });
  });

  it("pageTransition uses a slow ease-out curve", () => {
    expect(pageTransition.transition).toMatchObject({
      duration: duration.slow,
      ease: easeOut,
    });
  });

  it("fadeUp returns a variant with the given delay", () => {
    const v = fadeUp(0.5);
    expect(v.initial).toEqual({ opacity: 0, y: 10 });
    expect(v.animate).toEqual({ opacity: 1, y: 0 });
    expect(v.transition).toMatchObject({ delay: 0.5 });
  });
});

import { describe, expect, it } from "vitest";
import { reducedTransition } from "@/lib/transition";

describe("reducedTransition", () => {
  it("returns zero duration when shouldReduceMotion is true", () => {
    expect(reducedTransition({ shouldReduceMotion: true })).toEqual({ duration: 0 });
  });

  it("returns the transition when shouldReduceMotion is false", () => {
    const t = { duration: 0.3 };
    expect(reducedTransition({ shouldReduceMotion: false, transition: t })).toBe(t);
  });

  it("returns undefined when shouldReduceMotion is false and no transition", () => {
    expect(reducedTransition({ shouldReduceMotion: false })).toBeUndefined();
  });

  it("returns zero duration when shouldReduceMotion is true even with transition", () => {
    expect(reducedTransition({ shouldReduceMotion: true, transition: { duration: 0.5 } })).toEqual({ duration: 0 });
  });
});

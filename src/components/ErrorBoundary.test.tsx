import { describe, expect, it } from "vitest";
import { ErrorBoundary, resetKeysChanged } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("getDerivedStateFromError stores the thrown error", () => {
    const err = new Error("boom");
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err });
  });

  it("resetKeysChanged detects changes", () => {
    expect(resetKeysChanged(undefined, undefined)).toBe(false);
    expect(resetKeysChanged(["a"], ["a"])).toBe(false);
    expect(resetKeysChanged(["a"], ["b"])).toBe(true);
    expect(resetKeysChanged(["a"], ["a", "b"])).toBe(true);
    expect(resetKeysChanged(undefined, ["a"])).toBe(true);
  });
});

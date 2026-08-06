// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { reducedMotion } from "@/store/system";

const {
  markViewTransitionSupport,
  supportsViewTransitions,
  withViewTransition,
} = await import("@/lib/viewTransition");

type Doc = { startViewTransition?: unknown };

const stub = (impl?: (update: () => void) => unknown) => {
  (document as unknown as Doc).startViewTransition =
    impl ??
    ((update: () => void) => {
      update();
      return { finished: Promise.resolve() };
    });
};

afterEach(() => {
  (document as unknown as Doc).startViewTransition = undefined;
  document.documentElement.removeAttribute("data-view-transitions");
  reducedMotion.value = "user";
});

describe("viewTransition", () => {
  it("reports no support when the api is absent", () => {
    expect(supportsViewTransitions()).toBe(false);
  });

  it("reports support once the api exists", () => {
    stub();
    expect(supportsViewTransitions()).toBe(true);
  });

  it("marks the root only while the api is available", () => {
    markViewTransitionSupport();
    expect(document.documentElement.hasAttribute("data-view-transitions")).toBe(false);

    stub();
    markViewTransitionSupport();
    expect(document.documentElement.hasAttribute("data-view-transitions")).toBe(true);
  });

  it("runs the update directly when the api is missing", () => {
    const update = vi.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("routes the update through the api when supported", () => {
    const start = vi.fn((update: () => void) => {
      update();
      return { finished: Promise.resolve() };
    });
    stub(start);

    const update = vi.fn();
    withViewTransition(update);

    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("skips the transition when motion is reduced", () => {
    const start = vi.fn();
    stub(start);
    reducedMotion.value = "always";

    const update = vi.fn();
    withViewTransition(update);

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });
});

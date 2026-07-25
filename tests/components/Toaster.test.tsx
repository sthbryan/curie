// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/Toaster";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function show(fire: () => void): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Toaster />);
  });
  vi.useFakeTimers();
  act(() => {
    fire();
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  const toastEl = container.querySelector<HTMLElement>("[data-sonner-toast]");
  if (!toastEl) throw new Error("no toast rendered");
  return toastEl;
}

function glyphClass(toastEl: HTMLElement): string {
  return toastEl.querySelector("[data-icon] > *")?.getAttribute("class") ?? "";
}

afterEach(() => {
  vi.useRealTimers();
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
});

describe("Toaster", () => {
  it("gives success its own accent and glyph", () => {
    const success = show(() => toast.success("DONE"));
    expect(success.className).toContain("border-l-success");
    expect(glyphClass(success)).toContain("text-success");
  });

  it("gives errors an accent that cannot be mistaken for success", () => {
    const error = show(() => toast.error("FAILED"));
    expect(error.className).toContain("border-l-error");
    expect(glyphClass(error)).toContain("text-error");
  });

  it("marks a pending promise with a neutral spinner instead of a colour", () => {
    const pending = show(() =>
      toast.promise(new Promise(() => {}), {
        loading: "WORKING",
        success: "DONE",
        error: "FAILED",
      }),
    );
    expect(pending.className).toContain("border-l-fg-4");
    expect(pending.querySelector("[data-icon] .animate-spin")).not.toBeNull();
  });

  it("sizes the icon box to the title line so the glyph centres on it", () => {
    const pending = show(() =>
      toast.promise(new Promise(() => {}), {
        loading: "WORKING",
        success: "DONE",
        error: "FAILED",
      }),
    );
    const icon = pending.querySelector("[data-icon]");
    expect(icon?.className).toContain("relative");
    expect(icon?.className).toContain("h-4.5");
    expect(icon?.className).toContain("items-center");
  });
});

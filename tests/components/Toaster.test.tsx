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
  it("mounts Sephiro's viewport with its aria label", () => {
    show(() => toast.success("DONE"));
    const viewport = container?.querySelector("[class*=sph-toast-viewport]");
    expect(viewport?.className).toContain("sph-toast-viewport");
    expect(container?.querySelector('[aria-label*="Notifications"]')).not.toBeNull();
  });

  it("marks a success toast, so Sephiro can paint its tone", () => {
    const success = show(() => toast.success("DONE"));
    expect(success.className).toContain("sph-toast");
    expect(success.getAttribute("data-type")).toBe("success");
    expect(success.querySelector("[data-icon] .sph-toast__status-icon")).not.toBeNull();
  });

  it("marks an error toast apart from success", () => {
    const error = show(() => toast.error("FAILED"));
    expect(error.className).toContain("sph-toast");
    expect(error.getAttribute("data-type")).toBe("error");
  });

  it("shows the title as the toast content", () => {
    const success = show(() => toast.success("DONE"));
    expect(success.textContent).toContain("DONE");
  });
});

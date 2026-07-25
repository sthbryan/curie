// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastPromiseMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    promise: (...args: unknown[]) => toastPromiseMock(...args),
  },
}));

const { promiseToast } = await import("@/lib/toast");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render(node: ReactNode): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(node);
  });
  return container;
}

afterEach(() => {
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

beforeEach(() => {
  toastPromiseMock.mockReset();
});

function options() {
  return toastPromiseMock.mock.calls[0][1] as {
    loading: ReactNode;
    success: () => ReactNode;
    error: (e: unknown) => ReactNode;
  };
}

describe("promiseToast", () => {
  it("hands sonner one toast for the whole promise", () => {
    const promise = Promise.resolve("done");
    promiseToast(promise, {
      loading: { label: "INSTALLING", detail: "owner/repo" },
      success: { label: "INSTALLED", detail: "owner/repo" },
      error: () => ({ label: "INSTALL FAILED" }),
    });

    expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    expect(toastPromiseMock.mock.calls[0][0]).toBe(promise);
  });

  it("spins only while loading, and keeps the detail readable", () => {
    promiseToast(Promise.resolve("done"), {
      loading: { label: "INSTALLING", detail: "MiniMax-AI/skills" },
      success: { label: "INSTALLED", detail: "MiniMax-AI/skills" },
      error: (e) => ({ label: "INSTALL FAILED", detail: String(e) }),
    });

    const loading = render(options().loading);
    expect(loading.textContent).toContain("INSTALLING");
    expect(loading.textContent).toContain("MiniMax-AI/skills");
    expect(loading.querySelector(".animate-spin")).not.toBeNull();
    expect(loading.querySelector(".normal-case")?.textContent).toBe("MiniMax-AI/skills");
  });

  it("drops the spinner once the promise settles", () => {
    promiseToast(Promise.resolve("done"), {
      loading: { label: "INSTALLING" },
      success: { label: "INSTALLED", detail: "owner/repo" },
      error: (e) => ({ label: "INSTALL FAILED", detail: String(e) }),
    });

    const success = render(options().success());
    expect(success.textContent).toContain("INSTALLED");
    expect(success.querySelector(".animate-spin")).toBeNull();
  });

  it("renders the mapped error detail", () => {
    promiseToast(Promise.reject(new Error("boom")).catch(() => "handled"), {
      loading: { label: "INSTALLING" },
      success: { label: "INSTALLED" },
      error: (e) => ({ label: "INSTALL FAILED", detail: String(e) }),
    });

    const failure = render(options().error(new Error("boom")));
    expect(failure.textContent).toContain("INSTALL FAILED");
    expect(failure.textContent).toContain("boom");
    expect(failure.querySelector(".animate-spin")).toBeNull();
  });
});

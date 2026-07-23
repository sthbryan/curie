// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "@/components/ErrorFallback";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root?.render(ui); });
}

function unmount() {
  if (root) { act(() => { root?.unmount(); }); root = null; }
  if (container) { container.remove(); container = null; }
}

afterEach(unmount);
beforeEach(() => { lang.value = "en"; });

const base = { error: new Error("boom"), reset: vi.fn() };

describe("ErrorFallback", () => {
  it("renders the error message", () => {
    mount(<ErrorFallback {...base} />);
    expect(container?.textContent).toContain("boom");
  });

  it("renders fallback for unknown error", () => {
    mount(<ErrorFallback error={new Error()} reset={vi.fn()} />);
    expect(container?.textContent).toContain("Unknown error");
  });

  it("calls reset when retry is clicked", () => {
    const reset = vi.fn();
    mount(<ErrorFallback error={new Error("boom")} reset={reset} />);
    const btns = container?.querySelectorAll("button");
    const retryBtn = Array.from(btns ?? []).find((b) => b.textContent === "RETRY");
    retryBtn?.click();
    expect(reset).toHaveBeenCalledOnce();
  });

  it("renders home button when onHome is provided", () => {
    mount(<ErrorFallback {...base} onHome={vi.fn()} />);
    expect(container?.textContent).toContain("GO HOME");
  });

  it("renders reload button when variant is root", () => {
    mount(<ErrorFallback {...base} variant="root" />);
    expect(container?.textContent).toContain("RELOAD APP");
  });
});

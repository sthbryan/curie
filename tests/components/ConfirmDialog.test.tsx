// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

const base = {
  open: true,
  title: "Remove?",
  confirmLabel: "Yes",
  cancelLabel: "No",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("returns null when closed", () => {
    mount(<ConfirmDialog {...base} open={false} />);
    expect(container?.textContent).toBe("");
  });

  it("renders title and buttons when open", () => {
    mount(<ConfirmDialog {...base} />);
    expect(document.body.textContent).toContain("Remove?");
    expect(document.body.textContent).toContain("Yes");
    expect(document.body.textContent).toContain("No");
  });

  it("calls onConfirm when confirm is clicked", () => {
    const onConfirm = vi.fn();
    mount(<ConfirmDialog {...base} onConfirm={onConfirm} />);
    const btns = document.body.querySelectorAll("button");
    const confirmBtn = Array.from(btns).find((b) => b.textContent === "Yes");
    confirmBtn?.click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = vi.fn();
    mount(<ConfirmDialog {...base} onCancel={onCancel} />);
    const btns = document.body.querySelectorAll("button");
    const cancelBtn = Array.from(btns).find((b) => b.textContent === "No");
    cancelBtn?.click();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

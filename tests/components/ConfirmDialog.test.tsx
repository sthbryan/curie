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
  act(() => {
    root?.render(ui);
  });
}

function rerender(ui: React.ReactElement) {
  act(() => {
    root?.render(ui);
  });
}

function unmount() {
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

function button(label: string) {
  return Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  );
}

function type(value: string) {
  const input = document.body.querySelector<HTMLInputElement>("input");
  act(() => {
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    mount(<ConfirmDialog {...base} open={false} />);
    expect(container?.textContent).toBe("");
    expect(document.body.querySelector("[role=alertdialog]")).toBeNull();
  });

  it("renders title and buttons when open", () => {
    mount(<ConfirmDialog {...base} />);
    expect(document.body.textContent).toContain("Remove?");
    expect(button("Yes")).toBeDefined();
    expect(button("No")).toBeDefined();
  });

  it("calls onConfirm when confirm is clicked", () => {
    const onConfirm = vi.fn();
    mount(<ConfirmDialog {...base} onConfirm={onConfirm} />);
    button("Yes")?.click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = vi.fn();
    mount(<ConfirmDialog {...base} onCancel={onCancel} />);
    button("No")?.click();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("cancels on Escape but not while busy", () => {
    const onCancel = vi.fn();
    mount(<ConfirmDialog {...base} onCancel={onCancel} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onCancel).toHaveBeenCalledOnce();

    rerender(<ConfirmDialog {...base} onCancel={onCancel} busy />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("ignores a backdrop click while busy", () => {
    const onCancel = vi.fn();
    mount(<ConfirmDialog {...base} onCancel={onCancel} busy busyLabel="Removing" />);
    const backdrop = document.body.querySelector<HTMLElement>("[aria-hidden]");
    act(() => {
      backdrop?.click();
    });
    expect(onCancel).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Removing");
  });

  it("locks body scroll while open and restores it on close", () => {
    mount(<ConfirmDialog {...base} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps the confirm button locked until the phrase matches", () => {
    mount(<ConfirmDialog {...base} confirmPhrase="DELETE" confirmPhraseLabel="Type DELETE" />);
    expect(button("Yes")?.hasAttribute("disabled")).toBe(true);

    type("del");
    expect(button("Yes")?.hasAttribute("disabled")).toBe(true);

    type("delete");
    expect(button("Yes")?.hasAttribute("disabled")).toBe(false);
  });

  it("forgets the typed phrase when it closes", () => {
    mount(<ConfirmDialog {...base} confirmPhrase="DELETE" confirmPhraseLabel="Type DELETE" />);
    type("DELETE");
    expect(button("Yes")?.hasAttribute("disabled")).toBe(false);

    rerender(<ConfirmDialog {...base} open={false} confirmPhrase="DELETE" />);
    rerender(<ConfirmDialog {...base} confirmPhrase="DELETE" confirmPhraseLabel="Type DELETE" />);
    expect(button("Yes")?.hasAttribute("disabled")).toBe(true);
  });

  it("describes itself for screen readers", () => {
    mount(<ConfirmDialog {...base} description="This cannot be undone" detail="pr-review" />);
    const dialog = document.body.querySelector("[role=alertdialog]");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    const describedBy = dialog?.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")?.textContent).toBe("This cannot be undone");
  });
});

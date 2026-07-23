// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChoiceButton } from "@/components/ChoiceButton";

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

describe("ChoiceButton", () => {
  it("renders the label", () => {
    mount(<ChoiceButton active={false} label="Option A" onClick={vi.fn()} />);
    expect(container?.textContent).toContain("Option A");
  });

  it("renders sublabel when provided", () => {
    mount(<ChoiceButton active={false} label="A" sublabel="desc" onClick={vi.fn()} />);
    expect(container?.textContent).toContain("desc");
  });

  it("does not render sublabel when omitted", () => {
    mount(<ChoiceButton active={false} label="A" onClick={vi.fn()} />);
    expect(container?.textContent).toBe("A");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    mount(<ChoiceButton active={false} label="A" onClick={onClick} />);
    container?.querySelector("button")?.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

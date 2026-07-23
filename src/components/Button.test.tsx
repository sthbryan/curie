// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./Button";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
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

const SIZES = ["xs", "sm", "md", "lg", "xl", "hero"] as const;
const VARIANTS = [
  "primary",
  "accent",
  "accent-outline",
  "outline",
  "danger",
  "ghost",
  "link",
] as const;

describe("Button", () => {
  it("renders children and defaults to type=button with variant=outline", () => {
    mount(<Button>hello</Button>);
    const btn = container?.querySelector("button");
    expect(btn?.type).toBe("button");
    expect(btn?.textContent).toBe("hello");
    expect(btn?.getAttribute("aria-pressed")).toBeNull();
  });

  it("applies every size without throwing", () => {
    for (const size of SIZES) {
      mount(<Button size={size}>x</Button>);
      expect(container?.querySelector("button")).not.toBeNull();
      unmount();
    }
  });

  it("applies every variant without throwing", () => {
    for (const variant of VARIANTS) {
      mount(<Button variant={variant}>x</Button>);
      expect(container?.querySelector("button")).not.toBeNull();
      unmount();
    }
  });

  it("marks aria-pressed when selected and uses the selected visual style", () => {
    mount(<Button selected>selected</Button>);
    const btn = container?.querySelector("button");
    expect(btn?.getAttribute("aria-pressed")).toBe("true");
    expect(btn?.className).toContain("bg-fg");
    expect(btn?.className).toContain("text-bg");
  });

  it("uses the primary visual when variant is primary", () => {
    mount(<Button variant="primary">go</Button>);
    expect(container?.querySelector("button")?.className).toContain("bg-fg");
  });

  it("forwards extra HTML attributes", () => {
    mount(
      <Button disabled onClick={() => {}} data-testid="btn">
        ok
      </Button>,
    );
    const btn = container?.querySelector('[data-testid="btn"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("merges custom className", () => {
    mount(<Button className="extra-class">ok</Button>);
    expect(container?.querySelector("button")?.className).toContain("extra-class");
  });

  it("respects explicit type prop", () => {
    mount(<Button type="submit">submit</Button>);
    expect(container?.querySelector("button")?.type).toBe("submit");
  });

  it("applies active:scale only on xl/hero sizes", () => {
    mount(<Button size="md">md</Button>);
    expect(container?.querySelector("button")?.className).not.toContain("active:scale");
    unmount();

    mount(<Button size="xl">xl</Button>);
    expect(container?.querySelector("button")?.className).toContain("active:scale");
  });
});

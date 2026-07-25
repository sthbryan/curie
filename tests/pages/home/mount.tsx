import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import type { ReactNode } from "react";
import { Router } from "wouter";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

export function mount(ui: ReactNode): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Router>{ui}</Router>);
  });
  return container;
}

export function cleanup() {
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

export function flush(fn: () => void) {
  act(() => {
    fn();
  });
}

export function click(el: Element | null | undefined) {
  act(() => {
    (el as HTMLElement | null)?.click();
  });
}

export function text(el: HTMLElement | null): string {
  return el?.textContent ?? "";
}

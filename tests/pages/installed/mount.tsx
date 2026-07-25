import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import type { ReactNode } from "react";
import { Router } from "wouter";
import type { SkillInfo } from "@/components/types";

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

export function click(el: Element | null | undefined) {
  act(() => {
    (el as HTMLElement | null)?.click();
  });
}

export function text(el: HTMLElement | null): string {
  return el?.textContent ?? "";
}

export function buttonWith(el: HTMLElement, label: string) {
  return Array.from(el.querySelectorAll("button")).find((b) => b.textContent?.includes(label));
}

export function skillFixture(
  name: string,
  agents: string[] = ["Codex"],
  overrides: Partial<SkillInfo> = {},
): SkillInfo {
  return {
    name,
    path: `/skills/${name}`,
    scope: "global",
    agents,
    source: `me/${name}`,
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

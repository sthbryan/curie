// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import type { SkillSearchResult } from "@/components/types";
import {
  skills,
  skillsError,
  skillsLoading,
  skillUpdates,
  updatesError,
  updatesLoading,
} from "@/store/skills";
import { hasBooted, lang, node, reducedMotion, stage, theme } from "@/store/system";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { Find } = await import("@/pages/find/index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Router>{ui}</Router>);
  });
}

const sample: SkillSearchResult = {
  id: "1",
  name: "impeccable",
  source: "pbakaus/impeccable",
  installs: 1234,
  package: "pbakaus/impeccable",
  url: "https://example.com/impeccable",
};

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockClear();
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
});

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

function setControlledValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Find", () => {
  it("shows the package hint when the query is too short", () => {
    render(<Find />);
    expect(container?.textContent).toMatch(/type at least 2|2\+ chars|min 2/i);
  });

  it("invokes find_skills after the debounce window when the query is long enough", async () => {
    invokeMock.mockResolvedValue([sample]);
    render(<Find />);

    const input = container?.querySelector('input[type="search"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();

    act(() => {
      if (input) setControlledValue(input, "impeccable");
    });

    // Wait past the 280ms debounce.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320));
    });

    expect(invokeMock).toHaveBeenCalledWith("find_skills", {
      query: "impeccable",
      owner: null,
    });
    expect(container?.textContent).toContain("impeccable");
  });

  it("renders the error and dismisses it without searching again", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "find_skills") return Promise.reject("not found");
      return Promise.resolve(undefined);
    });
    render(<Find />);

    const input = container?.querySelector('input[type="search"]') as HTMLInputElement | null;
    act(() => {
      if (input) setControlledValue(input, "missing");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320));
    });

    expect(container?.textContent).toContain("not found");

    const closeBtn = container?.querySelector(
      'button[aria-label="Dismiss"]',
    ) as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();

    const callsBefore = invokeMock.mock.calls.length;
    await act(async () => {
      closeBtn?.click();
      await new Promise((r) => setTimeout(r, 320));
    });

    expect(container?.textContent).not.toContain("not found");
    expect(invokeMock.mock.calls.length).toBe(callsBefore);
  });

  it("searches on Enter without waiting out the debounce", async () => {
    invokeMock.mockResolvedValue([sample]);
    render(<Find />);

    const input = container?.querySelector('input[type="search"]') as HTMLInputElement | null;
    act(() => {
      if (input) setControlledValue(input, "impeccable");
    });

    await act(async () => {
      input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await Promise.resolve();
    });

    expect(invokeMock).toHaveBeenCalledWith("find_skills", {
      query: "impeccable",
      owner: null,
    });

    // The debounce was cancelled, so waiting it out adds no second call.
    const calls = invokeMock.mock.calls.filter(([cmd]) => cmd === "find_skills").length;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320));
    });
    expect(invokeMock.mock.calls.filter(([cmd]) => cmd === "find_skills").length).toBe(calls);
  });

  it("clears both fields at once", async () => {
    invokeMock.mockResolvedValue([sample]);
    render(<Find />);

    const input = container?.querySelector('input[type="search"]') as HTMLInputElement | null;
    act(() => {
      if (input) setControlledValue(input, "impeccable");
    });

    const clear = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("CLEAR"),
    );
    expect(clear).toBeDefined();

    await act(async () => {
      clear?.click();
      await new Promise((r) => setTimeout(r, 320));
    });

    expect(input?.value).toBe("");
    expect(container?.textContent).toMatch(/type at least 2/i);
  });

  it("points an empty query at the rankings", () => {
    render(<Find />);
    const explore = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("EXPLORE"),
    );
    expect(explore).toBeDefined();
  });
});

// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => toastSuccessMock(...args) },
}));

const { UrlInstallForm } = await import(
  "@/pages/custom/components/UrlInstallForm"
);
const { useCustomActions } = await import(
  "@/pages/custom/hooks/useCustomActions"
);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastActions: { current: ReturnType<typeof useCustomActions> | null } = {
  current: null,
};

function Probe() {
  lastActions.current = useCustomActions();
  return <UrlInstallForm actions={lastActions.current} />;
}

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
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
  lastActions.current = null;
}

function getInput(): HTMLInputElement {
  const input = container?.querySelector(
    'input[type="text"]',
  ) as HTMLInputElement | null;
  if (!input) throw new Error("input not found");
  return input;
}

function getButtonByText(text: string): HTMLButtonElement {
  const buttons = Array.from(container?.querySelectorAll("button") ?? []);
  const found = buttons.find((b) => b.textContent?.includes(text));
  if (!found) throw new Error(`button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

function setInputValue(value: string) {
  act(() => {
    const input = getInput();
    const proto = Object.getPrototypeOf(input);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  toastSuccessMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  unmount();
  vi.useRealTimers();
});

describe("UrlInstallForm", () => {
  it("keeps the install button disabled until the input looks like a URL or package", () => {
    mount();
    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(true);

    setInputValue("owner/repo@skill");
    expect(installButton.disabled).toBe(false);
  });

  it("auto-clears the input and dismisses the success banner after a successful install", async () => {
    invokeMock.mockResolvedValue({
      package: "owner/repo",
      message: "ok",
    } as SkillInstallResult);

    mount();
    setInputValue("owner/repo@skill");

    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(false);

    await act(async () => {
      installButton.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container?.textContent).toContain("Installed owner/repo@skill");
    expect(getInput().value).toBe("owner/repo@skill");

    await act(async () => {
      vi.advanceTimersByTime(2600);
    });

    expect(getInput().value).toBe("");
    expect(container?.textContent).not.toContain("Installed owner/repo@skill");
  });

  it("does not clear the input if the user typed something new while the success was showing", async () => {
    invokeMock.mockResolvedValue({
      package: "owner/repo",
      message: "ok",
    } as SkillInstallResult);

    mount();
    setInputValue("owner/repo@skill");

    const installButton = getButtonByText("INSTALL");
    await act(async () => {
      installButton.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    setInputValue("vercel-labs/agent-skills@pdf");

    await act(async () => {
      vi.advanceTimersByTime(2600);
    });

    expect(getInput().value).toBe("vercel-labs/agent-skills@pdf");
    expect(container?.textContent).not.toContain("Installed owner/repo@skill");
  });
});

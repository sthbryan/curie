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
import type { SkillDetection, SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastLoadingMock = vi.fn();
const toastPromiseMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    loading: (...args: unknown[]) => {
      toastLoadingMock(...args);
      return "toast-id-1";
    },
    promise: (...args: unknown[]) => toastPromiseMock(...args),
  },
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

function detection(count: number): SkillDetection {
  return {
    isSkill: true,
    total: count,
    truncated: false,
    skills: Array.from({ length: count }, (_, i) => ({
      name: `skill-${i}`,
      description: `desc ${i}`,
    })),
    refUsed: null,
  };
}

function mockBackend(detected: SkillDetection | Error, install?: SkillInstallResult) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === "detect_skill") {
      return detected instanceof Error ? Promise.reject(detected) : Promise.resolve(detected);
    }
    return Promise.resolve(install ?? ({ package: "owner/repo", message: "ok" } as SkillInstallResult));
  });
}

async function settleDetection() {
  await act(async () => {
    vi.advanceTimersByTime(700);
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  toastLoadingMock.mockReset();
  toastPromiseMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  unmount();
  vi.useRealTimers();
});

describe("UrlInstallForm", () => {
  it("keeps the install button disabled while the input is unverified", async () => {
    mockBackend(detection(1));
    mount();
    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(true);

    setInputValue("owner/repo@skill");
    expect(installButton.disabled).toBe(true);

    await settleDetection();
    expect(installButton.disabled).toBe(false);
  });

  it("keeps the install button disabled when the repo holds no skills", async () => {
    mockBackend({ isSkill: false, total: 0, truncated: false, skills: [], refUsed: null });
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    expect(getButtonByText("INSTALL").disabled).toBe(true);
  });

  it("keeps a single INSTALL label when several skills are detected", async () => {
    mockBackend(detection(18));
    mount();
    setInputValue("owner/repo");
    await settleDetection();

    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(false);
    expect(installButton.textContent).not.toMatch(/18/);
    expect(container?.textContent).toMatch(/18 SKILLS/);
  });

  it("clears the input after a successful install", async () => {
    mockBackend(detection(1));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(false);

    await act(async () => {
      installButton.click();
      for (let i = 0; i < 10; i++) await Promise.resolve();
    });

    expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    expect(getInput().value).toBe("");
  });

  it("does not clear the input if the user typed something new while the success was showing", async () => {
    mockBackend(detection(1));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    const installButton = getButtonByText("INSTALL");
    await act(async () => {
      installButton.click();
      for (let i = 0; i < 10; i++) await Promise.resolve();
    });

    setInputValue("vercel-labs/agent-skills@pdf");

    expect(getInput().value).toBe("vercel-labs/agent-skills@pdf");
    expect(toastPromiseMock).toHaveBeenCalledTimes(1);
  });
});

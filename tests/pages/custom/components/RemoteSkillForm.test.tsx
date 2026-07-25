// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillDetection, SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastErrorMock = vi.fn();
const promiseToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/lib/toast", () => ({
  promiseToast: (...args: unknown[]) => promiseToastMock(...args),
}));

const { RemoteSkillForm } = await import("@/pages/custom/components/RemoteSkillForm");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<RemoteSkillForm />);
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

function getInput(): HTMLInputElement {
  const input = container?.querySelector("#custom-remote-input") as HTMLInputElement | null;
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

function mockBackend(detected: SkillDetection | Error) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === "detect_skill") {
      return detected instanceof Error ? Promise.reject(detected) : Promise.resolve(detected);
    }
    return Promise.resolve({ package: "owner/repo", message: "ok" } as SkillInstallResult);
  });
}

async function settleDetection() {
  await act(async () => {
    vi.advanceTimersByTime(700);
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

async function clickInstall() {
  await act(async () => {
    getButtonByText("INSTALL").click();
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  toastErrorMock.mockReset();
  promiseToastMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  unmount();
  vi.useRealTimers();
});

describe("RemoteSkillForm", () => {
  it("keeps the install button disabled while the input is unverified", async () => {
    mockBackend(detection(1));
    mount();
    expect(getButtonByText("INSTALL").disabled).toBe(true);

    setInputValue("owner/repo@skill");
    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("READING THE REPO");

    await settleDetection();
    expect(getButtonByText("INSTALL").disabled).toBe(false);
  });

  it("never asks the backend about input that is not a target", () => {
    mockBackend(detection(1));
    mount();
    setInputValue("not a url");

    expect(container?.textContent).toContain("DOESN'T LOOK LIKE A REPO");
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("keeps the install button disabled when the repo holds no skills", async () => {
    mockBackend({ isSkill: false, total: 0, truncated: false, skills: [], refUsed: null });
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("THIS REPO HAS NO SKILLS");
  });

  it("surfaces a failed check without enabling install", async () => {
    mockBackend(new Error("network down"));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("COULD NOT READ THE REPO");
  });

  it("keeps a single INSTALL label and previews the detected skills", async () => {
    mockBackend(detection(18));
    mount();
    setInputValue("owner/repo");
    await settleDetection();

    const installButton = getButtonByText("INSTALL");
    expect(installButton.disabled).toBe(false);
    expect(installButton.textContent).not.toMatch(/18/);
    expect(container?.textContent).toContain("18 SKILLS READY");
    expect(container?.textContent).toContain("skill-0");
    expect(container?.textContent).toContain("+12 MORE");
  });

  it("clears the input after a successful install", async () => {
    mockBackend(detection(1));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();
    await clickInstall();

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "owner/repo@skill",
      skillName: null,
    });
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(getInput().value).toBe("");
  });

  it("does not clear the input if the user typed something new while the success was showing", async () => {
    mockBackend(detection(1));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();
    await clickInstall();

    setInputValue("vercel-labs/agent-skills@pdf");

    expect(getInput().value).toBe("vercel-labs/agent-skills@pdf");
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
  });

  it("clears the input from the affordance inside the field", async () => {
    mockBackend(detection(1));
    mount();
    setInputValue("owner/repo@skill");
    await settleDetection();

    const clear = container?.querySelector('button[aria-label="Clear the field"]');
    expect(clear).not.toBeNull();
    await act(async () => {
      (clear as HTMLButtonElement).click();
    });

    expect(getInput().value).toBe("");
    expect(container?.textContent).toContain("WAITING FOR A REPO");
  });
});

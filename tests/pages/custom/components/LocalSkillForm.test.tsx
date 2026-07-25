// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillSaveResult } from "@/components/types";

const invokeMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { MdUploadForm } = await import("@/pages/custom/components/MdUploadForm");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<MdUploadForm />);
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

function getNameInput(): HTMLInputElement {
  const input = container?.querySelector("#custom-md-name") as HTMLInputElement | null;
  if (!input) throw new Error("name input not found");
  return input;
}

function getContentInput(): HTMLTextAreaElement {
  const textarea = container?.querySelector("#custom-md-content") as HTMLTextAreaElement | null;
  if (!textarea) throw new Error("content textarea not found");
  return textarea;
}

function getButtonByText(text: string): HTMLButtonElement {
  const buttons = Array.from(container?.querySelectorAll("button") ?? []);
  const found = buttons.find((b) => b.textContent?.includes(text));
  if (!found) throw new Error(`button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
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

function fillForm() {
  setInputValue(getNameInput(), "my-skill");
  setInputValue(getContentInput(), "# Skill content");
}

async function clickSave() {
  await act(async () => {
    getButtonByText("SAVE").click();
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  mount();
});

afterEach(unmount);

describe("MdUploadForm", () => {
  it("keeps save disabled until name and content are valid", () => {
    expect(getButtonByText("SAVE").disabled).toBe(true);

    fillForm();
    expect(getButtonByText("SAVE").disabled).toBe(false);
  });

  it("keeps save disabled for a name the backend would reject", () => {
    setInputValue(getNameInput(), "-bad name");
    setInputValue(getContentInput(), "# Skill content");

    expect(getButtonByText("SAVE").disabled).toBe(true);
  });

  it("shows success via toast and clears the form inputs", async () => {
    const saved: CustomSkillSaveResult = {
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Saved",
      installed: true,
      installMessage: null,
    };
    invokeMock.mockResolvedValueOnce(saved);

    fillForm();
    await clickSave();

    expect(invokeMock).toHaveBeenCalledWith("save_custom_skill", {
      name: "my-skill",
      content: "# Skill content",
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(getNameInput().value).toBe("");
    expect(getContentInput().value).toBe("");
  });

  it("surfaces save errors via toast and keeps the form inputs", async () => {
    invokeMock.mockRejectedValueOnce("invalid name");

    fillForm();
    await clickSave();

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(getNameInput().value).toBe("my-skill");
    expect(getContentInput().value).toBe("# Skill content");
  });

  it("empties the form from the CLEAR affordance", () => {
    fillForm();

    act(() => {
      getButtonByText("CLEAR").click();
    });

    expect(getNameInput().value).toBe("");
    expect(getContentInput().value).toBe("");
  });
});

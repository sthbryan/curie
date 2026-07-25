// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillSaveResult } from "@/components/types";

const invokeMock = vi.fn();
const successToastMock = vi.fn();
const warningToastMock = vi.fn();
const errorToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  successToast: (...args: unknown[]) => successToastMock(...args),
  warningToast: (...args: unknown[]) => warningToastMock(...args),
  errorToast: (...args: unknown[]) => errorToastMock(...args),
}));

const { LocalSkillForm } = await import("@/pages/custom/components/LocalSkillForm");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<LocalSkillForm />);
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
  const input = container?.querySelector("#custom-local-name") as HTMLInputElement | null;
  if (!input) throw new Error("name input not found");
  return input;
}

function getContentInput(): HTMLTextAreaElement {
  const textarea = container?.querySelector("#custom-local-content") as HTMLTextAreaElement | null;
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

const VALID_CONTENT = ["---", "name: my-skill", "description: what it does", "---", "", "# Body"].join(
  "\n",
);

function fillForm(content = VALID_CONTENT) {
  setInputValue(getNameInput(), "my-skill");
  setInputValue(getContentInput(), content);
}

async function clickInstall() {
  await act(async () => {
    getButtonByText("INSTALL").click();
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  successToastMock.mockReset();
  warningToastMock.mockReset();
  errorToastMock.mockReset();
  mount();
});

afterEach(unmount);

describe("LocalSkillForm", () => {
  it("keeps install disabled until name and content are valid", () => {
    expect(getButtonByText("INSTALL").disabled).toBe(true);

    fillForm();
    expect(getButtonByText("INSTALL").disabled).toBe(false);
  });

  it("keeps install disabled for a name the backend would reject", () => {
    setInputValue(getNameInput(), "-bad name");
    setInputValue(getContentInput(), VALID_CONTENT);

    expect(getButtonByText("INSTALL").disabled).toBe(true);
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
    await clickInstall();

    expect(invokeMock).toHaveBeenCalledWith("save_custom_skill", {
      name: "my-skill",
      content: VALID_CONTENT,
    });
    expect(successToastMock).toHaveBeenCalledTimes(1);
    expect(getNameInput().value).toBe("");
    expect(getContentInput().value).toBe("");
  });

  it("surfaces save errors via toast and keeps the form inputs", async () => {
    invokeMock.mockRejectedValueOnce("invalid name");

    fillForm();
    await clickInstall();

    expect(errorToastMock).toHaveBeenCalledTimes(1);
    expect(getNameInput().value).toBe("my-skill");
    expect(getContentInput().value).toBe(VALID_CONTENT);
  });

  it("blocks install and says what the frontmatter is missing", () => {
    fillForm("# Just a body");
    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("needs a frontmatter block");

    fillForm("---\nname: my-skill\n---\n# Body");
    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("missing: description");

    fillForm();
    expect(getButtonByText("INSTALL").disabled).toBe(false);
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

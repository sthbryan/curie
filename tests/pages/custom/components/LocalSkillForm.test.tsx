// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const promiseToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ onDragDropEvent: () => Promise.resolve(() => {}) }),
}));

vi.mock("@/lib/boot", () => ({
  loadSkills: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  promiseToast: (...args: unknown[]) => promiseToastMock(...args),
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
  promiseToastMock.mockReset();
  mount();
});

afterEach(unmount);

describe("LocalSkillForm", () => {
  it("keeps install disabled until the content carries a usable frontmatter", () => {
    expect(getButtonByText("INSTALL").disabled).toBe(true);

    fillForm();
    expect(getButtonByText("INSTALL").disabled).toBe(false);
  });

  it("takes the skill name from the frontmatter, with no name field to fill in", async () => {
    invokeMock.mockResolvedValueOnce({
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Installed",
    } as CustomSkillInstallResult);

    expect(container?.querySelector("#custom-local-name")).toBeNull();

    fillForm();
    expect(container?.textContent).toContain("READY TO INSTALL AS my-skill");

    await clickInstall();

    expect(invokeMock).toHaveBeenCalledWith("install_custom_skill", {
      name: "my-skill",
      content: VALID_CONTENT,
      projectPath: null,
    });
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(getContentInput().value).toBe("");
  });

  it("keeps the content when the install fails", async () => {
    invokeMock.mockRejectedValueOnce("invalid name");

    fillForm();
    await clickInstall();

    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(getContentInput().value).toBe(VALID_CONTENT);
  });

  it("blocks install and says what is missing in plain words", () => {
    fillForm("# Just a body");
    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("has to start with a block between --- lines");

    fillForm("---\nname: my-skill\n---\n# Body");
    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain("missing the skill's description");

    fillForm("---\ndescription: what it does\n---\n# Body");
    expect(container?.textContent).toContain("missing the skill's name");

    fillForm("---\nfoo: bar\n---\n# Body");
    expect(container?.textContent).toContain("missing the skill's name and description");

    fillForm();
    expect(getButtonByText("INSTALL").disabled).toBe(false);
  });

  it("blocks install when the name could not be a directory", () => {
    fillForm("---\nname: my skill\ndescription: x\n---\n# Body");

    expect(getButtonByText("INSTALL").disabled).toBe(true);
    expect(container?.textContent).toContain('"my skill" won\'t work as a name');
  });

  it("empties the form from the CLEAR affordance", () => {
    fillForm();

    act(() => {
      getButtonByText("CLEAR").click();
    });

    expect(getContentInput().value).toBe("");
  });
});

// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomSkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const openMock = vi.fn();
const promiseToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => openMock(...args),
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

function getButtonByText(text: string): HTMLButtonElement {
  const buttons = Array.from(container?.querySelectorAll("button") ?? []);
  const found = buttons.find((b) => b.textContent?.includes(text));
  if (!found) throw new Error(`button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

async function clickButton(text: string) {
  await act(async () => {
    getButtonByText(text).click();
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  openMock.mockReset();
  openMock.mockResolvedValue(null);
  promiseToastMock.mockReset();
  mount();
});

afterEach(unmount);

describe("LocalSkillForm", () => {
  it("offers only the archive upload", () => {
    expect(container?.textContent).toContain("UPLOAD .ZIP");
    expect(container?.querySelector("textarea")).toBeNull();
    expect(container?.textContent).not.toContain("SKILL.md");
    expect(container?.textContent).not.toContain("CHOOSE FOLDER");
  });

  it("installs a .zip or .skill archive picked from disk", async () => {
    openMock.mockResolvedValueOnce("/Users/me/Downloads/my-skill.skill");
    invokeMock.mockResolvedValueOnce({
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Installed",
    } as CustomSkillInstallResult);

    await clickButton("UPLOAD .ZIP");

    expect(openMock).toHaveBeenCalledWith(
      expect.objectContaining({
        directory: false,
        multiple: false,
        filters: [{ name: "Skill archive", extensions: ["zip", "skill"] }],
      }),
    );
    expect(invokeMock).toHaveBeenCalledWith("install_custom_skill_path", {
      path: "/Users/me/Downloads/my-skill.skill",
      projectPath: null,
    });
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
  });

  it("installs nothing when the picker is dismissed", async () => {
    await clickButton("UPLOAD .ZIP");

    expect(invokeMock).not.toHaveBeenCalled();
  });
});

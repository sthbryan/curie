// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SkillNameCell } from "@/components/discovery/SkillNameCell";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(ui);
  });
}

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

beforeEach(() => {
  lang.value = "en";
});

describe("SkillNameCell", () => {
  it("shows the package under the name and wears no chip by default", () => {
    mount(<SkillNameCell ns="find" name="impeccable" pkg="pbakaus@impeccable" installed={false} />);
    expect(container?.textContent).toContain("impeccable");
    expect(container?.textContent).toContain("pbakaus@impeccable");
    expect(container?.textContent).not.toContain("INSTALLED");
    expect(container?.textContent).not.toContain("OFFICIAL");
  });

  it("marks an installed skill", () => {
    mount(<SkillNameCell ns="find" name="impeccable" pkg="pbakaus@impeccable" installed />);
    expect(container?.textContent).toContain("INSTALLED");
  });

  it("marks an official skill with the accent chip", () => {
    mount(
      <SkillNameCell
        ns="explore"
        name="commit"
        pkg="anthropic@commit"
        installed={false}
        official
      />,
    );
    expect(container?.textContent).toContain("OFFICIAL");
    expect(container?.querySelector(".text-accent")).not.toBeNull();
  });
});

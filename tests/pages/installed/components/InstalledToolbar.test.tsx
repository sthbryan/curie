// @vitest-environment happy-dom

import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstalledToolbar } from "@/pages/installed/components/InstalledToolbar";
import {
  agentFilter,
  query,
  QUERY_DEBOUNCE_MS,
  queryInput,
  updatesOnly,
} from "@/pages/installed/store/store";
import { skills, skillUpdates } from "@/store/skills";
import { lang } from "@/store/system";
import { buttonWith, cleanup, click, mount, skillFixture, text } from "../mount";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  lang.value = "en";
  skills.value = [
    skillFixture("alpha", ["Codex", "Zed"]),
    skillFixture("beta", ["Codex"]),
    skillFixture("gamma", ["Codex"]),
  ];
  skillUpdates.value = [];
  queryInput.value = "";
  query.value = "";
  agentFilter.value = null;
  updatesOnly.value = false;
});

function typeSearch(el: HTMLElement, value: string) {
  const input = el.querySelector<HTMLInputElement>("input[type=search]");
  act(() => {
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

describe("InstalledToolbar", () => {
  it("counts the visible rows against the total", () => {
    expect(text(mount(<InstalledToolbar />))).toContain("3");
  });

  it("echoes the typed text immediately and filters after the debounce", () => {
    vi.useFakeTimers();
    const el = mount(<InstalledToolbar />);

    typeSearch(el, "alpha");
    expect(queryInput.value).toBe("alpha");
    expect(query.value).toBe("");

    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    });
    expect(query.value).toBe("alpha");
  });

  it("offers every tool with its count", () => {
    const el = mount(<InstalledToolbar />);
    const options = Array.from(el.querySelectorAll("option")).map((o) => o.textContent);
    expect(options[0]).toBe("ALL");
    expect(options.some((o) => o?.includes("Codex") && o?.includes("3"))).toBe(true);
    expect(options.some((o) => o?.includes("Zed") && o?.includes("1"))).toBe(true);
  });

  it("filters by the picked tool", () => {
    const el = mount(<InstalledToolbar />);
    const select = el.querySelector<HTMLSelectElement>("select");
    act(() => {
      if (select) {
        select.value = "Zed";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    expect(agentFilter.value).toBe("Zed");
  });

  it("hides the updates toggle until something is outdated", () => {
    expect(buttonWith(mount(<InstalledToolbar />), "UPDATES")).toBeUndefined();

    cleanup();
    skillUpdates.value = [
      { name: "alpha", source: "me/alpha", updateAvailable: true, checkable: true },
    ];
    expect(buttonWith(mount(<InstalledToolbar />), "UPDATES")).toBeDefined();
  });

  it("keeps the tool filter when the updates toggle goes on", () => {
    skillUpdates.value = [
      { name: "alpha", source: "me/alpha", updateAvailable: true, checkable: true },
    ];
    agentFilter.value = "Codex";

    const el = mount(<InstalledToolbar />);
    click(buttonWith(el, "UPDATES"));

    expect(updatesOnly.value).toBe(true);
    expect(agentFilter.value).toBe("Codex");
  });

  it("only offers to clear once a filter is on", () => {
    expect(buttonWith(mount(<InstalledToolbar />), "CLEAR")).toBeUndefined();

    cleanup();
    agentFilter.value = "Codex";
    const el = mount(<InstalledToolbar />);
    click(buttonWith(el, "CLEAR"));
    expect(agentFilter.value).toBeNull();
  });
});

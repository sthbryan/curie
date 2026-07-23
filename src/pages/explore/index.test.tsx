// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import type { ExplorePage, SkillExploreResult } from "@/components/types";
import { useSkillsStore } from "@/store/skills";
import { useUiStore } from "@/store/ui";

const invokeMock = vi.fn();
const openUrlMock = vi.fn();
const loadGlobalSkillsMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => openUrlMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { Explore } = await import("./index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Router>{ui}</Router>);
  });
}

const sample: SkillExploreResult = {
  id: "1",
  name: "impeccable",
  source: "pbakaus/impeccable",
  installs: 1234,
  package: "pbakaus/impeccable",
  url: "https://example.com/impeccable",
  installsYesterday: 10,
  change: 0.05,
  isOfficial: false,
};

const page = (overrides: Partial<ExplorePage> = {}): ExplorePage => ({
  skills: [sample],
  total: 1,
  hasMore: false,
  page: 0,
  view: "hot",
  ...overrides,
});

beforeEach(() => {
  invokeMock.mockReset();
  openUrlMock.mockReset();
  loadGlobalSkillsMock.mockClear();
  useSkillsStore.setState({
    skills: [],
    skillsLoading: false,
    skillsError: null,
    skillUpdates: [],
    updatesLoading: false,
    updatesError: null,
  });
  useUiStore.setState({
    theme: "dark",
    lang: "en",
    reducedMotion: "system",
    hasBooted: true,
    stage: "home",
    node: { installed: true, version: "20.0.0", path: "/usr/bin/node", manager: "volta" },
  });
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

describe("Explore", () => {
  it("loads the default 'hot' view on mount", async () => {
    invokeMock.mockResolvedValue(page());
    render(<Explore />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(invokeMock).toHaveBeenCalledWith("explore_skills", { view: "hot", page: 0 });
    expect(container?.textContent).toContain("impeccable");
  });

  it("switches the view when a view button is clicked", async () => {
    invokeMock.mockImplementation((_cmd, args) => {
      const view = (args as { view?: string })?.view ?? "hot";
      return Promise.resolve(page({ view: view as ExplorePage["view"] }));
    });
    render(<Explore />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const trendingBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.toLowerCase().includes("trending"),
    );
    expect(trendingBtn).toBeDefined();
    await act(async () => {
      trendingBtn?.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(invokeMock).toHaveBeenCalledWith("explore_skills", {
      view: "trending",
      page: 0,
    });
  });

  it("opens the skills.sh URL when the 'open site' button is clicked", async () => {
    invokeMock.mockResolvedValue(page());
    render(<Explore />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const openSite = Array.from(container?.querySelectorAll("button") ?? []).find(
      (b) =>
        b.textContent?.toLowerCase().includes("open site") ||
        b.textContent?.toLowerCase().includes("skills.sh"),
    );
    expect(openSite).toBeDefined();
    await act(async () => {
      openSite?.click();
    });
    expect(openUrlMock).toHaveBeenCalledWith("https://skills.sh");
  });
});

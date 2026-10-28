// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, expect, it } from "vitest";

import type { SkillExploreResult } from "@/components/types";
import { ExploreList } from "@/pages/explore/components/ExploreList";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rows: SkillExploreResult[] = Array.from({ length: 3 }, (_, i) => ({
  id: `id-${i}`,
  name: `skill-${i}`,
  source: "owner",
  installs: 10 + i,
  package: `owner/skill-${i}`,
  url: `https://skills.sh/owner/skill-${i}`,
  installsYesterday: null,
  change: null,
  isOfficial: false,
}));

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(hasMore: boolean) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <ExploreList
        view="hot"
        loading={false}
        empty={false}
        skills={rows}
        installedPackages={new Set()}
        installingPackage={null}
        installBusy={false}
        hasMore={hasMore}
        atCap={!hasMore}
        loadingMore={false}
        onInstall={() => {}}
        onLoadMore={() => {}}
      />,
    );
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

it("renders the rows inside the table and the load-more control after it", () => {
  mount(true);
  expect(container?.querySelectorAll("tbody tr").length).toBe(3);
  const wrap = container?.querySelector(".sph-table-wrap");
  expect(wrap?.className).toContain("flex-1");
  expect(wrap?.getAttribute("data-virtual")).toBe("true");
  expect(wrap?.nextElementSibling?.querySelector("button")?.textContent).toContain("LOAD MORE");
});

it("shows the cap notice instead of the button", () => {
  mount(false);
  expect(container?.textContent).toContain("SHOWING FIRST 300");
});

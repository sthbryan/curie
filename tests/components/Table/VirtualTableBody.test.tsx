// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
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
  return container;
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

type Item = { id: string };

const columns: ColumnDef<Item>[] = [
  { key: "id", header: "ID", cell: (row) => <span>{row.id}</span> },
];

const ROW_HEIGHT = 56;
const GRID = "grid-cols-[1fr]";

function rows(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => ({ id: `row-${i}` }));
}

function render(n: number) {
  return mount(
    <Table
      columns={columns}
      rows={rows(n)}
      gridTemplate={GRID}
      getRowKey={(r) => r.id}
      rowHeight={ROW_HEIGHT}
    />,
  );
}

describe("Table with rowHeight", () => {
  it("renders a windowed slice instead of every row", () => {
    const el = render(500);
    const rendered = el.querySelectorAll("article");
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(40);
  });

  it("reserves the height of the rows it skipped", () => {
    const el = render(500);
    const spacer = el.querySelector<HTMLElement>("[style*='padding-bottom']");
    const rendered = el.querySelectorAll("article").length;
    expect(spacer?.style.paddingBottom).toBe(`${(500 - rendered) * ROW_HEIGHT}px`);
    expect(spacer?.style.paddingTop).toBe("0px");
  });

  it("pins every row to the given height", () => {
    const el = render(50);
    const first = el.querySelector<HTMLElement>("article");
    expect(first?.style.height).toBe(`${ROW_HEIGHT}px`);
  });

  it("renders short lists whole with no spacer", () => {
    const el = render(4);
    expect(el.querySelectorAll("article").length).toBe(4);
    const spacer = el.querySelector<HTMLElement>("[style*='padding-bottom']");
    expect(spacer?.style.paddingBottom).toBe("0px");
  });

  it("keeps the header above the rows in its own scroll viewport", () => {
    const el = render(50);
    const viewport = el.firstElementChild;
    expect(viewport?.className).toContain("overflow-y-auto");
    expect(viewport?.firstElementChild?.className).toContain("sticky");
    expect(el.textContent).toContain("ID");
  });

  it("starts the window at the top of the list", () => {
    const el = render(500);
    expect(el.textContent).toContain("row-0");
    expect(el.textContent).not.toContain("row-400");
  });
});

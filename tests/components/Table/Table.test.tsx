// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Table } from "@/components/Table";
import type { ColumnDef } from "@/components/Table";

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

afterEach(unmount);

interface Item {
  id: string;
  name: string;
  value: number;
}

const columns: ColumnDef<Item>[] = [
  { key: "name", header: "NAME", cell: (row) => <span>{row.name}</span> },
  {
    key: "value",
    header: "VALUE",
    headerClassName: "text-right",
    cellClassName: "text-right",
    cell: (row) => <span>{row.value}</span>,
  },
];

const rows: Item[] = [
  { id: "1", name: "alpha", value: 10 },
  { id: "2", name: "beta", value: 20 },
  { id: "3", name: "gamma", value: 30 },
];

const GRID = "grid-cols-[1fr_4rem]";

describe("Table", () => {
  it("renders column headers", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );
    expect(container?.textContent).toContain("NAME");
    expect(container?.textContent).toContain("VALUE");
  });

  it("renders one row per item", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );
    const articles = container?.querySelectorAll("article");
    expect(articles?.length).toBe(3);
  });

  it("renders cell content via cell renderers", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );
    expect(container?.textContent).toContain("alpha");
    expect(container?.textContent).toContain("beta");
    expect(container?.textContent).toContain("gamma");
    expect(container?.textContent).toContain("10");
    expect(container?.textContent).toContain("20");
    expect(container?.textContent).toContain("30");
  });

  it("passes the index to cell renderers", () => {
    const values: number[] = [];
    mount(
      <Table
        columns={[
          {
            key: "index",
            header: "#",
            cell: (_row, i) => {
              values.push(i);
              return null;
            },
          },
        ]}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );
    expect(values).toEqual([0, 1, 2]);
  });

  it("calls onSort when clicking a sortable column header", () => {
    const onSort = vi.fn();
    const sortableCols: ColumnDef<Item>[] = [
      { key: "name", header: "NAME", sortable: true, cell: (row) => <span>{row.name}</span> },
      { key: "value", header: "VALUE", cell: (row) => <span>{row.value}</span> },
    ];

    mount(
      <Table
        columns={sortableCols}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        onSort={onSort}
      />,
    );

    const buttons = container?.querySelectorAll("button");
    expect(buttons?.length).toBe(1);

    act(() => {
      buttons?.[0]?.click();
    });
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("leaves non-sortable headers as plain text", () => {
    const onSort = vi.fn();
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        onSort={onSort}
      />,
    );

    expect(container?.querySelectorAll("button")?.length).toBe(0);
    expect(container?.textContent).toContain("VALUE");
    expect(onSort).not.toHaveBeenCalled();
  });

  it("announces the direction of the active sort column", () => {
    const sortableCols: ColumnDef<Item>[] = [
      { key: "name", header: "NAME", sortable: true, cell: () => null },
      { key: "value", header: "VALUE", sortable: true, cell: () => null },
    ];

    mount(
      <Table
        columns={sortableCols}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        sortKey="name"
        sortDir="asc"
      />,
    );

    const labels = Array.from(container?.querySelectorAll("button") ?? []).map((b) =>
      b.getAttribute("aria-label"),
    );
    expect(labels[0]).toBe("NAME · SORTED ASCENDING");
    expect(labels[1]).toBe("VALUE · SORTABLE");
  });

  it("flips the announcement when sorting descending", () => {
    mount(
      <Table
        columns={[{ key: "value", header: "VALUE", sortable: true, cell: () => null }]}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        sortKey="value"
        sortDir="desc"
      />,
    );

    expect(container?.querySelector("button")?.getAttribute("aria-label")).toBe(
      "VALUE · SORTED DESCENDING",
    );
  });

  it("renders skeleton when loading", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        loading
        skeletonRows={4}
      />,
    );

    const bones = container?.querySelectorAll('[class*="bg-surface-hover"]');
    expect(bones!.length).toBeGreaterThan(0);
    const articles = container?.querySelectorAll("article");
    expect(articles?.length).toBe(0);
  });

  it("renders the requested number of skeleton rows", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        loading
        skeletonRows={5}
      />,
    );

    const skeletonRows = container?.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonRows?.length).toBe(5);
  });

  it("applies cellClassName to cell wrappers", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );

    const article = container?.querySelector("article");
    const cells = article?.querySelectorAll(":scope > div");
    expect(cells?.length).toBe(2);
    const secondCell = cells?.[1];
    expect(secondCell?.className).toContain("text-right");
  });

  it("applies headerClassName to every header cell", () => {
    mount(
      <Table
        columns={columns}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );

    const header = container?.firstElementChild;
    const cells = header?.querySelectorAll(":scope > *");
    expect(cells?.length).toBe(2);
    expect(cells?.[1]?.className).toContain("text-right");
  });

  it("renders empty when rows is empty", () => {
    mount(
      <Table
        columns={columns}
        rows={[]}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
      />,
    );

    const articles = container?.querySelectorAll("article");
    expect(articles?.length).toBe(0);
    expect(container?.textContent).toContain("NAME");
    expect(container?.textContent).toContain("VALUE");
  });

  it("sorts through a real button so the keyboard works natively", () => {
    mount(
      <Table
        columns={[{ key: "x", header: "X", sortable: true, cell: () => null }]}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        onSort={vi.fn()}
      />,
    );

    const btn = container?.querySelector("button");
    expect(btn?.tagName).toBe("BUTTON");
    expect(btn?.getAttribute("type")).toBe("button");
  });

  it("renders skeleton with custom skeleton content from column def", () => {
    const colsWithSkeleton: ColumnDef<Item>[] = [
      {
        key: "name",
        header: "NAME",
        cell: (row) => <span>{row.name}</span>,
        skeleton: <div className="custom-skeleton" />,
      },
    ];

    mount(
      <Table
        columns={colsWithSkeleton}
        rows={rows}
        gridTemplate={GRID}
        getRowKey={(r) => r.id}
        loading
        skeletonRows={1}
      />,
    );

    expect(container?.querySelector(".custom-skeleton")).not.toBeNull();
  });
});

// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DragDropPayload =
  | { type: "over"; position: { x: number; y: number } }
  | { type: "drop"; paths: string[]; position: { x: number; y: number } }
  | { type: "leave" };

const invokeMock = vi.fn();
const toastError = vi.fn();
let handler: ((event: { payload: DragDropPayload }) => void) | null = null;
const unlisten = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: (fn: (event: { payload: DragDropPayload }) => void) => {
      handler = fn;
      return Promise.resolve(unlisten);
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

const { useFileDrop } = await import("@/pages/custom/hooks/useFileDrop");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const onFile = vi.fn();
let dragging = false;
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function Harness({ enabled }: { enabled: boolean }) {
  dragging = useFileDrop({ enabled, onFile }).dragging;
  return null;
}

async function mount(enabled = true) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<Harness enabled={enabled} />);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function emit(payload: DragDropPayload) {
  await act(async () => {
    handler?.({ payload });
    await Promise.resolve();
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  toastError.mockReset();
  onFile.mockReset();
  unlisten.mockReset();
  handler = null;
  dragging = false;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

describe("useFileDrop", () => {
  it("reads the dropped markdown file and hands it over", async () => {
    invokeMock.mockResolvedValue("---\nname: dropped\n---\nbody");
    await mount();

    await emit({ type: "drop", paths: ["/tmp/dropped.md"], position: { x: 0, y: 0 } });

    expect(invokeMock).toHaveBeenCalledWith("read_markdown_file", { path: "/tmp/dropped.md" });
    expect(onFile).toHaveBeenCalledWith("dropped.md", "---\nname: dropped\n---\nbody");
    expect(dragging).toBe(false);
  });

  it("flags the drag while a file hovers the window", async () => {
    await mount();

    await emit({ type: "over", position: { x: 0, y: 0 } });
    expect(dragging).toBe(true);

    await emit({ type: "leave" });
    expect(dragging).toBe(false);
  });

  it("warns instead of reading when nothing dropped is markdown", async () => {
    await mount();

    await emit({ type: "drop", paths: ["/tmp/photo.png"], position: { x: 0, y: 0 } });

    expect(invokeMock).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("reports a file it cannot read", async () => {
    invokeMock.mockRejectedValue("could not read /tmp/x.md");
    await mount();

    await emit({ type: "drop", paths: ["/tmp/x.md"], position: { x: 0, y: 0 } });

    expect(toastError).toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("ignores drops while disabled", async () => {
    await mount(false);

    await emit({ type: "over", position: { x: 0, y: 0 } });
    expect(dragging).toBe(false);

    await emit({ type: "drop", paths: ["/tmp/a.md"], position: { x: 0, y: 0 } });
    expect(invokeMock).not.toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("stops listening when unmounted", async () => {
    await mount();
    act(() => root?.unmount());
    root = null;

    expect(unlisten).toHaveBeenCalled();
  });
});

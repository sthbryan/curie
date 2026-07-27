// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorNotice } from "@/components/ErrorNotice";
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

describe("ErrorNotice", () => {
  it("announces itself and shows the raw message", () => {
    mount(<ErrorNotice title="Search failed" message="offline" onDismiss={() => {}} />);
    const alert = container?.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Search failed");
    expect(alert?.textContent).toContain("offline");
  });

  it("offers no retry unless one is given", () => {
    mount(<ErrorNotice title="Install failed" message="boom" onDismiss={() => {}} />);
    expect(container?.textContent).not.toContain("RETRY");
    expect(container?.querySelectorAll("button").length).toBe(1);
  });

  it("keeps retry and dismiss as separate actions", () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    mount(
      <ErrorNotice title="Search failed" message="boom" onRetry={onRetry} onDismiss={onDismiss} />,
    );

    const retry = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("RETRY"),
    );
    const dismiss = container?.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement;

    act(() => {
      retry?.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      dismiss.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

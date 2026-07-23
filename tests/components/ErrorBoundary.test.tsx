// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary, type ErrorBoundaryFallbackProps, resetKeysChanged } from "@/components/ErrorBoundary";

// React 19 + happy-dom: enable act warnings globally for this file.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type BombProps = { shouldThrow: boolean; message?: string };

function Bomb({ shouldThrow, message = "boom" }: BombProps) {
  if (shouldThrow) throw new Error(message);
  return <div data-testid="child">child-ok</div>;
}

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(element);
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

afterEach(() => {
  unmount();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  it("getDerivedStateFromError stores the thrown error", () => {
    const err = new Error("boom");
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err });
  });

  it("resetKeysChanged detects changes", () => {
    expect(resetKeysChanged(undefined, undefined)).toBe(false);
    expect(resetKeysChanged(["a"], ["a"])).toBe(false);
    expect(resetKeysChanged(["a"], ["b"])).toBe(true);
    expect(resetKeysChanged(["a"], ["a", "b"])).toBe(true);
    expect(resetKeysChanged(undefined, ["a"])).toBe(true);
  });

  it("renders children when no error is thrown", () => {
    mount(
      <ErrorBoundary fallback={() => <div data-testid="fallback">fb</div>}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(container?.querySelector('[data-testid="child"]')?.textContent).toBe("child-ok");
    expect(container?.querySelector('[data-testid="fallback"]')).toBeNull();
  });

  it("renders the fallback when a child throws", () => {
    const fallback = ({ error, reset }: ErrorBoundaryFallbackProps) => (
      <div data-testid="fallback">
        <span data-testid="fb-error">{error.message}</span>
        <button type="button" onClick={reset}>
          reset
        </button>
      </div>
    );
    mount(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(container?.querySelector('[data-testid="child"]')).toBeNull();
    expect(container?.querySelector('[data-testid="fb-error"]')?.textContent).toBe("boom");
  });

  it("calls onError with the captured error and component info", () => {
    const onError = vi.fn();
    mount(
      <ErrorBoundary fallback={() => <div>fb</div>} onError={onError}>
        <Bomb shouldThrow message="explode" />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [error, info] = onError.mock.calls[0] as [Error, { componentStack?: string }];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("explode");
    expect(typeof info.componentStack).toBe("string");
  });

  it("logs to console.error in DEV when no onError handler is provided", () => {
    mount(
      <ErrorBoundary fallback={() => <div>fb</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    const spy = vi.mocked(console.error);
    const tagged = spy.mock.calls.find((call) => call[0] === "[ErrorBoundary]");
    expect(tagged).toBeDefined();
    expect(tagged?.[1]).toBeInstanceOf(Error);
  });

  it("recovers when resetKeys change after a captured error", () => {
    const fallback = ({ reset }: ErrorBoundaryFallbackProps) => (
      <div data-testid="fallback">
        <button type="button" onClick={reset}>
          reset
        </button>
      </div>
    );
    function Harness({ resetKey }: { resetKey: string }) {
      return (
        <ErrorBoundary fallback={fallback} resetKeys={[resetKey]}>
          <Bomb shouldThrow={resetKey === "first"} />
        </ErrorBoundary>
      );
    }

    mount(<Harness resetKey="first" />);
    expect(container?.querySelector('[data-testid="fallback"]')).not.toBeNull();

    act(() => {
      root?.render(<Harness resetKey="second" />);
    });
    expect(container?.querySelector('[data-testid="child"]')?.textContent).toBe("child-ok");
    expect(container?.querySelector('[data-testid="fallback"]')).toBeNull();
  });

  it("recovers when the fallback's reset callback is invoked", () => {
    const fallback = ({ reset }: ErrorBoundaryFallbackProps) => (
      <div data-testid="fallback">
        <button type="button" onClick={reset} data-testid="reset-btn">
          reset
        </button>
      </div>
    );
    function Harness({ shouldThrow }: { shouldThrow: boolean }) {
      return (
        <ErrorBoundary fallback={fallback}>
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    mount(<Harness shouldThrow />);
    expect(container?.querySelector('[data-testid="fallback"]')).not.toBeNull();

    // Switch the child to not throw, then click reset — boundary should clear and re-render children.
    act(() => {
      root?.render(<Harness shouldThrow={false} />);
    });
    expect(container?.querySelector('[data-testid="fallback"]')).not.toBeNull();

    act(() => {
      (container?.querySelector('[data-testid="reset-btn"]') as HTMLButtonElement | null)?.click();
    });
    expect(container?.querySelector('[data-testid="child"]')?.textContent).toBe("child-ok");
    expect(container?.querySelector('[data-testid="fallback"]')).toBeNull();
  });
});

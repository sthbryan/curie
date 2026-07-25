import { type RefObject, useEffect, useState } from "react";

export type VirtualWindow = {
  start: number;
  end: number;
  padTop: number;
  padBottom: number;
};

type Options = {
  count: number;
  rowHeight: number;
  viewport: RefObject<HTMLElement | null>;
  overscan?: number;
};

export function useVirtualRows({
  count,
  rowHeight,
  viewport,
  overscan = 6,
}: Options): VirtualWindow {
  const [metrics, setMetrics] = useState({ scrollTop: 0, height: 0 });

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;

    const measure = () => setMetrics({ scrollTop: el.scrollTop, height: el.clientHeight });
    measure();

    el.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [viewport]);

  const total = count * rowHeight;

  if (metrics.height === 0) {
    const end = Math.min(count, overscan * 4);
    return { start: 0, end, padTop: 0, padBottom: Math.max(0, total - end * rowHeight) };
  }

  const first = Math.floor(metrics.scrollTop / rowHeight);
  const visible = Math.ceil(metrics.height / rowHeight);
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, first + visible + overscan);

  return {
    start,
    end,
    padTop: start * rowHeight,
    padBottom: Math.max(0, total - end * rowHeight),
  };
}

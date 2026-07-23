import { useEffect, useState } from "react";

/**
 * Fake-but-honest progress for long ops without real telemetry.
 * Rises quickly at first, then asymptotes toward `cap` until the
 * parent clears `active` (job finished).
 */
export function useAsymptoticProgress(active: boolean, cap = 92): number {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const next = Math.min(cap, Math.round((1 - Math.exp(-t / 3.2)) * cap));
      setPct(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, cap]);

  return active ? pct : 0;
}

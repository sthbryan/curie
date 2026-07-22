import type { Lang } from "../i18n";
import { t } from "../i18n";

type Props = {
  lang: Lang;
  ready: boolean;
};

export function Header({ lang, ready }: Props) {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span className="font-display text-xl font-bold leading-none tracking-tight">curie</span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">v0.1.0</span>
      </div>
      <div
        className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-3"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${ready ? "bg-success" : "bg-fg-4"}`}
        />
        <span>{ready ? t(lang, "app.ready") : "—"}</span>
      </div>
    </header>
  );
}

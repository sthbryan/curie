import { t } from "@/i18n";
import { APP_NAME, APP_VERSION_LABEL } from "@/lib/meta";
import { useUiStore } from "@/store/ui";

type Props = {
  ready: boolean;
};

export function Header({ ready }: Props) {
  const lang = useUiStore((s) => s.lang);

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-bg px-5 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-baseline gap-2.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span className="font-display text-lg font-bold leading-none tracking-tight text-fg">
          {APP_NAME}
        </span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-4 border border-border px-1.5 py-px rounded-sm leading-none">
          {APP_VERSION_LABEL}
        </span>
      </div>

      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${ready ? "bg-success" : "bg-fg-4"}`}
          aria-hidden
        />
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">
          {ready ? t(lang, "app.ready") : "—"}
        </span>
      </div>
    </header>
  );
}

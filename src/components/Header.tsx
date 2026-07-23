import { useLocation } from "wouter";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/meta";
import { useUiStore } from "@/store/ui";

type Props = {
  ready: boolean;
};

const locationMap: Record<string, string> = {
  "/": "nav.home",
  "/installed": "nav.skills",
  "/marketplace": "nav.explore",
  "/find": "nav.find",
  "/custom": "nav.custom",
  "/settings": "nav.settings",
};

export function Header({ ready }: Props) {
  const lang = useUiStore((s) => s.lang);
  const [location] = useLocation();

  const currentLocation = locationMap[location] || location;

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-bg px-5 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-baseline gap-2.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span className="font-display text-lg font-bold leading-none tracking-tight text-fg uppercase">
          {t(lang, currentLocation)}
        </span>
      </div>

      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", ready ? "bg-success" : "bg-fg-4")}
          aria-hidden
        />
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">
          {t(lang, "app.ready")}
        </span>
      </div>
    </header>
  );
}

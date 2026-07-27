import { useLocation } from "wouter";
import { HeaderActivity } from "@/components/HeaderActivity";
import { useT } from "@/i18n";
import { APP_NAME } from "@/lib/meta";

const locationMap: Record<string, string> = {
  "/": "nav.home",
  "/installed": "nav.skills",
  "/marketplace": "nav.explore",
  "/find": "nav.find",
  "/custom": "nav.custom",
  "/settings": "nav.settings",
};

export function Header() {
  const t = useT();
  const [location] = useLocation();

  const currentLocation = locationMap[location] || location;

  return (
    <header
      className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-bg px-5 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <p className="flex items-baseline gap-2 font-mono uppercase tracking-label text-micro">
        <span className="text-fg-4">{APP_NAME}</span>
        <span aria-hidden className="text-fg-4/70">
          /
        </span>
        <span className="font-bold text-fg-2">{t(currentLocation)}</span>
      </p>

      <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <HeaderActivity />
      </div>
    </header>
  );
}

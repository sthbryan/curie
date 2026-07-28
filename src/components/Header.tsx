import { HeaderActivity } from "@/components/HeaderActivity";
import { ScopeChip } from "@/components/ScopeChip";
import { useT } from "@/i18n";
import { APP_NAME } from "@/lib/meta";
import type { Section } from "@/lib/routes";
import { useRoute } from "@/lib/routes";

const SECTION_KEYS: Record<Section, string> = {
  home: "nav.home",
  installed: "nav.skills",
  marketplace: "nav.explore",
  find: "nav.find",
  custom: "nav.custom",
  projects: "nav.projects",
  settings: "nav.settings",
};

export function Header() {
  const t = useT();
  const { section } = useRoute();

  return (
    <header
      className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-bg px-5 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <p className="flex items-baseline gap-2 font-mono uppercase tracking-label text-micro">
          <span className="text-fg-4">{APP_NAME}</span>
          <span aria-hidden className="text-fg-4/70">
            /
          </span>
          <span className="font-bold text-fg-2">{t(SECTION_KEYS[section])}</span>
        </p>

        <span aria-hidden className="text-fg-4/70">
          ·
        </span>

        <span className="min-w-0" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <ScopeChip />
        </span>
      </div>

      <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <HeaderActivity />
      </div>
    </header>
  );
}

import { t } from "../i18n";
import { useAppStore } from "../store/app";
import type { View } from "./types";

type Props = {
  view: Exclude<View, "home" | "installed" | "settings">;
};

export function Placeholder({ view }: Props) {
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);

  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-10">
      <span className="font-display text-heading font-bold tracking-tight text-fg">
        {view.toUpperCase()}
      </span>
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">
        {t(lang, "home.notBuilt")}
      </span>
      <button
        type="button"
        onClick={() => setView("home")}
        className="mt-4 h-9 px-4 border border-border-strong text-fg-2 rounded-sm font-mono uppercase tracking-label text-mono hover:border-fg-3 hover:text-fg active:scale-[0.99] transition-all duration-150"
      >
        {t(lang, "home.back")}
      </button>
    </main>
  );
}

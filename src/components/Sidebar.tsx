import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { View } from "./types";

type Props = {
  lang: Lang;
  view: View;
  setView: (view: View) => void;
};

const TOP_ITEMS: { id: View; key: "home" | "skills" | "explore" | "find" }[] = [
  { id: "home", key: "home" },
  { id: "installed", key: "skills" },
  { id: "marketplace", key: "explore" },
  { id: "search", key: "find" },
];

export function Sidebar({ lang, view, setView }: Props) {
  return (
    <nav className="flex w-24 shrink-0 flex-col border-r border-border py-5">
      <div className="flex flex-col gap-1 px-3">
        {TOP_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={
                active
                  ? "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono bg-fg text-bg font-bold transition-colors duration-150"
                  : "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-150"
              }
              onClick={() => setView(item.id)}
            >
              {t(lang, `nav.${item.key}`)}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <div className="flex flex-col gap-1 px-3">
        <button
          type="button"
          className={
            view === "settings"
              ? "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono bg-fg text-bg font-bold transition-colors duration-150"
              : "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-150"
          }
          onClick={() => setView("settings")}
        >
          {t(lang, "nav.settings")}
        </button>
      </div>
    </nav>
  );
}

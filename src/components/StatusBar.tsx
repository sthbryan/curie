import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { NodeInfo, ThemeMode } from "./types";

type Props = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  node: NodeInfo | null;
};

export function StatusBar({ lang, setLang, theme, setTheme, node }: Props) {
  function toggleLang() {
    setLang(lang === "en" ? "es" : "en");
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <footer className="shrink-0 flex items-center justify-between border-t border-border px-6 py-2.5 bg-bg">
      <div className="flex items-center gap-3 font-mono uppercase tracking-label text-micro text-fg-3">
        <span>CURIE</span>
        <span className="text-fg-4">·</span>
        <span>v0.1.0</span>
        <span className="text-fg-4">·</span>
        {node?.installed ? (
          <>
            <span>
              {t(lang, "status.node")} {node.version?.replace(/^v/, "") ?? "—"}
            </span>
            <span className="text-fg-4">·</span>
            <span>{node.manager ? `${node.manager}` : "system"}</span>
          </>
        ) : (
          <span>SETUP REQUIRED</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg transition-colors duration-150 px-2 h-7"
        >
          <span className={lang === "en" ? "text-fg font-bold" : "text-fg-4"}>EN</span>
          <span className="mx-1.5 text-fg-4">/</span>
          <span className={lang === "es" ? "text-fg font-bold" : "text-fg-4"}>ES</span>
        </button>
        <span className="text-fg-4 mx-1">·</span>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg transition-colors duration-150 px-2 h-7"
        >
          <span>{theme === "dark" ? "◐" : "◑"}</span>
          <span>{theme.toUpperCase()}</span>
        </button>
      </div>
    </footer>
  );
}

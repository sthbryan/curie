import { t } from "../i18n";
import { useAppStore } from "../store/app";

export function StatusBar() {
  const lang = useAppStore((s) => s.lang);
  const node = useAppStore((s) => s.node);

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
            <span>{node.manager ?? "system"}</span>
          </>
        ) : (
          <span>SETUP REQUIRED</span>
        )}
      </div>

      <div className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-4">
        <span className="inline-block h-1 w-1 rounded-full bg-fg-4" />
        <span>{lang.toUpperCase()}</span>
      </div>
    </footer>
  );
}

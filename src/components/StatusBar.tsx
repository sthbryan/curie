import type { ReactNode } from "react";
import { t } from "../i18n";
import { APP_NAME, APP_VERSION_LABEL } from "../lib/meta";
import { useAppStore } from "../store/app";

function Sep() {
  return <span className="text-fg-4/80 select-none">·</span>;
}

function Meta({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <span className={dim ? "text-fg-4" : "text-fg-3"}>{children}</span>;
}

export function StatusBar() {
  const lang = useAppStore((s) => s.lang);
  const node = useAppStore((s) => s.node);

  return (
    <footer className="shrink-0 flex h-9 items-center justify-between border-t border-border bg-surface px-5">
      <div className="flex min-w-0 items-center gap-2.5 font-mono uppercase tracking-label text-micro">
        <Meta>{APP_NAME}</Meta>
        <Sep />
        <Meta dim>{APP_VERSION_LABEL}</Meta>
        <Sep />
        {node?.installed ? (
          <>
            <Meta>
              {t(lang, "status.node")} {node.version?.replace(/^v/, "") ?? "—"}
            </Meta>
            <Sep />
            <Meta dim>{node.manager ?? "system"}</Meta>
          </>
        ) : (
          <Meta>{t(lang, "status.setupRequired")}</Meta>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-4">
        <span className="inline-block h-1 w-1 rounded-full bg-fg-4" aria-hidden />
        <span>{lang.toUpperCase()}</span>
      </div>
    </footer>
  );
}

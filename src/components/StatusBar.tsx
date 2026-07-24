import type { ReactNode } from "react";
import { Else, If, Then, When } from "react-if";
import { useLocation } from "wouter";
import { useT } from "@/i18n";
import { APP_NAME, APP_VERSION_LABEL } from "@/lib/meta";
import { lang, node } from "@/store/system";
import { appUpdate } from "@/store/update";

function Sep() {
  return <span className="text-fg-4/80 select-none">·</span>;
}

function Meta({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <span className={dim ? "text-fg-4" : "text-fg-3"}>{children}</span>;
}

export function StatusBar() {
  const t = useT();
  const [, navigate] = useLocation();
  const handleOpenUpdate = () => navigate("/settings");
  const hasUpdate = appUpdate.value?.updateAvailable === true;
  const upToDate = appUpdate.value != null && appUpdate.value.updateAvailable === false;

  return (
    <footer className="shrink-0 flex h-9 items-center justify-between border-t border-border bg-surface px-5">
      <div className="flex min-w-0 items-center gap-2.5 font-mono uppercase tracking-label text-micro">
        <Meta>{APP_NAME}</Meta>
        <Sep />
        <Meta dim>{APP_VERSION_LABEL}</Meta>
        <Sep />
        <If condition={node.value?.installed === true}>
          <Then>
            <Meta>
              {t("status.node")} {node.value?.version?.replace(/^v/, "") ?? "—"}
            </Meta>
            <Sep />
            <Meta dim>{node.value?.manager ?? "system"}</Meta>
          </Then>
          <Else>
            <Meta>{t("status.setupRequired")}</Meta>
          </Else>
        </If>
        <When condition={hasUpdate}>
          <Sep />
          <button
            type="button"
            onClick={handleOpenUpdate}
            className="inline-flex items-center gap-1.5 cursor-pointer text-accent hover:underline font-mono uppercase tracking-label text-micro"
          >
            <span
              className="inline-block h-1 w-1 rounded-full bg-accent animate-pulse"
              aria-hidden
            />
            {t("status.appUpdateAvailable")}
          </button>
        </When>
        <When condition={upToDate}>
          <Sep />
          <span className="inline-flex items-center gap-1.5 text-fg-4 font-mono uppercase tracking-label text-micro">
            <span className="inline-block h-1 w-1 rounded-full bg-success" aria-hidden />
            {t("status.appUpToDate")}
          </span>
        </When>
      </div>

      <div className="flex shrink-0 items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-4">
        <span className="inline-block h-1 w-1 rounded-full bg-fg-4" aria-hidden />
        <span>{lang.value.toUpperCase()}</span>
      </div>
    </footer>
  );
}

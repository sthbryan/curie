import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@zovaris/sephiro/button";
import { Notice } from "@zovaris/sephiro/notice";
import { Download, RotateCcw, SquareArrowOutUpRight } from "lucide-react";
import { Case, Default, Switch } from "react-if";
import { toast } from "sonner";

import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { checkAppUpdate, installAppUpdate, RESTART_DELAY, restartApp } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { APP_VERSION_LABEL } from "@/lib/meta";
import { useReducedMotion } from "@/lib/motion";
import { formatRelative } from "@/lib/skills";
import { lang } from "@/store/system";
import {
  appInstallRunning,
  appUpdate,
  appUpdateCheckedAt,
  appUpdateError,
  appUpdateLoading,
} from "@/store/update";

export function UpdateSection() {
  const t = useT("settings");
  const shouldReduceMotion = useReducedMotion();

  const checking = appUpdateLoading.value;
  const error = appUpdateError.value;
  const info = appUpdate.value;
  const checkedAt = appUpdateCheckedAt.value;

  const handleCheck = () => {
    void checkAppUpdate();
  };

  const handleInstall = async () => {
    const result = await installAppUpdate();
    if (!result) return;
    if (result.success) {
      toast.success(t("updateInstallSuccess"));
      setTimeout(() => {
        void restartApp();
      }, RESTART_DELAY);
      return;
    }
    toast.error(result.message || t("updateInstallFailed"));
    const fallback = result.fallbackUrl ?? info?.releaseUrl;
    if (fallback) void Promise.resolve(openUrl(fallback)).catch(() => {});
  };

  const handleOpenRelease = () => {
    const url = info?.releaseUrl;
    if (url) void Promise.resolve(openUrl(url)).catch(() => {});
  };

  return (
    <section className="flex flex-col gap-4">
      <Label>{t("updates")}</Label>

      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-body text-sm text-fg">{APP_VERSION_LABEL}</span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {checkedAt
              ? t("updateCheckedAt", { when: formatRelative(checkedAt, Date.now(), lang.value) })
              : t("updateNeverChecked")}
          </span>
        </div>

        <Button size="sm" variant="secondary" onClick={handleCheck} disabled={checking}>
          <RotateCcw size={12} className={cn(checking && !shouldReduceMotion && "animate-spin")} />
          {checking ? t("updateChecking") : t("updateCheckBtn")}
        </Button>
      </div>

      <div aria-live="polite">
        <Switch>
          <Case condition={error !== null}>
            <Notice variant="danger" title={t("updateFailed")}>
              {error}
            </Notice>
          </Case>

          <Case condition={info?.updateAvailable === true}>
            <Notice variant="info" title={`${t("updateAvailable")} v${info?.latestVersion}`}>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleInstall}
                  disabled={appInstallRunning.value}
                >
                  <Download size={10} strokeWidth={1.5} />
                  {appInstallRunning.value ? t("updateInstalling") : t("updateInstall")}
                </Button>
                <Button size="sm" variant="secondary" onClick={handleOpenRelease}>
                  {t("updateOpenFallback")}
                  <SquareArrowOutUpRight size={10} strokeWidth={1.5} />
                </Button>
              </div>
            </Notice>
          </Case>

          <Case condition={info !== null}>
            <p className="font-body text-sm text-fg-3">{t("updateUpToDate")}</p>
          </Case>

          <Default>
            <p className="font-body text-sm text-fg-4">{t("updateNeverCheckedHint")}</p>
          </Default>
        </Switch>
      </div>
    </section>
  );
}

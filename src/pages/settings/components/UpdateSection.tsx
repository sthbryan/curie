import { openUrl } from "@tauri-apps/plugin-opener";
import { Download, RotateCcw, SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";
import { Case, Default, Switch } from "react-if";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { checkAppUpdate, installAppUpdate, RESTART_DELAY, restartApp } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { APP_VERSION_LABEL } from "@/lib/meta";
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
  const shouldReduceMotion = useReducedMotionConfig();

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

        <Button size="sm" variant="outline" onClick={handleCheck} disabled={checking}>
          <RotateCcw size={12} className={cn(checking && !shouldReduceMotion && "animate-spin")} />
          {checking ? t("updateChecking") : t("updateCheckBtn")}
        </Button>
      </div>

      <div aria-live="polite">
        <Switch>
          <Case condition={error !== null}>
            <div className="flex flex-col gap-2 border border-border-strong border-l-2 border-l-error bg-surface-tint px-5 py-4">
              <span className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-error">
                <TriangleAlert size={12} />
                {t("updateFailed")}
              </span>
              <span className="font-body text-sm text-fg-3">{error}</span>
            </div>
          </Case>

          <Case condition={info?.updateAvailable === true}>
            <div className="flex flex-col gap-3 border border-border-strong border-l-2 border-l-accent bg-surface-tint px-5 py-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  {t("updateAvailable")}
                </span>
                <span className="font-body text-sm text-fg">v{info?.latestVersion}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="accent"
                  onClick={handleInstall}
                  disabled={appInstallRunning.value}
                >
                  <Download size={10} strokeWidth={1.5} />
                  {appInstallRunning.value ? t("updateInstalling") : t("updateInstall")}
                </Button>
                <Button size="xs" variant="outline" onClick={handleOpenRelease}>
                  {t("updateOpenFallback")}
                  <SquareArrowOutUpRight size={10} strokeWidth={1.5} />
                </Button>
              </div>
            </div>
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

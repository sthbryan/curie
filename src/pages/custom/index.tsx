import { motion } from "motion/react";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { MdUploadForm } from "./components/MdUploadForm";
import { UrlInstallForm } from "./components/UrlInstallForm";
import { useCustomActions } from "./hooks/useCustomActions";

export function Custom() {
  const t = useT("custom");
  const [, navigate] = useLocation();
  const actions = useCustomActions();

  const handleGoHome = () => navigate("/");

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>{t("eyebrow")}</Label>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <h2 className="font-display text-heading font-bold tracking-tight text-fg">
                  {t("title")}
                </h2>
                <p className="max-w-2xl font-body text-sm text-fg-3">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp(0.05)}
          className="flex flex-col gap-8 border border-border bg-surface-tint p-8"
        >
          <UrlInstallForm actions={actions} />

          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">OR</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <MdUploadForm actions={actions} />
        </motion.section>

        <motion.section
          {...fadeUp(0.1)}
          className="flex items-center justify-end gap-4 border-t border-border pt-6"
        >
          <Button size="sm" variant="ghost" onClick={handleGoHome}>
            {t("back")}
          </Button>
        </motion.section>
      </div>
    </main>
  );
}

import { FileCode } from "lucide-react";
import { motion } from "motion/react";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { t } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { lang } from "@/store/system";
export function Custom() {
  const [, navigate] = useLocation();

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>{t(lang.value, "custom.eyebrow")}</Label>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <h2 className="font-display text-heading font-bold tracking-tight text-fg">
                  {t(lang.value, "custom.title")}
                </h2>
                <p className="max-w-2xl font-body text-sm text-fg-3">
                  {t(lang.value, "custom.subtitle")}
                </p>
              </div>
              <span className="font-mono uppercase tracking-label text-micro text-fg-4 border border-border px-1.5 py-0.5 rounded-sm">
                {t(lang.value, "custom.comingSoon")}
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp(0.05)}
          className="flex flex-col items-center justify-center gap-5 rounded-sm border border-dashed border-border bg-surface/40 px-8 py-20"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border text-fg-3">
            <FileCode size={22} strokeWidth={1.25} />
          </span>
          <p className="max-w-md text-center font-body text-sm text-fg-3">
            {t(lang.value, "custom.body")}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate("/")}>
            {t(lang.value, "custom.back")}
          </Button>
        </motion.section>
      </div>
    </main>
  );
}

import { motion } from "motion/react";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";

export function QuickActions() {
  const t = useT("home");
  const [, navigate] = useLocation();

  return (
    <motion.section {...fadeUp(0.12)} className="flex flex-col gap-5">
      <Label>{t("actions")}</Label>
      <div className="flex gap-3">
        <Button
          size="hero"
          variant="primary"
          className="flex-1 justify-between"
          onClick={() => navigate("/find")}
        >
          <span>{t("install")}</span>
          <span>→</span>
        </Button>
        <Button
          size="hero"
          variant="outline"
          className="px-6 font-bold text-fg"
          onClick={() => navigate("/marketplace")}
        >
          {t("exploreBtn")}
        </Button>
        <Button size="hero" variant="ghost" className="px-6" onClick={() => navigate("/installed")}>
          {t("viewSkills")}
        </Button>
      </div>
    </motion.section>
  );
}

import { motion } from "motion/react";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { totalSkills } from "../lib/derived";
import { StatLine } from "./StatLine";

export function HomeIntro() {
  const t = useT("home");

  return (
    <motion.section {...fadeUp(0)} className="flex flex-col gap-3">
      <Label>{t("eyebrow")}</Label>
      <h2 className="font-display text-heading font-bold tracking-tight text-fg">{t("title")}</h2>
      {totalSkills.value === 0 ? (
        <p className="max-w-2xl font-body text-sm text-fg-3">{t("skillsNone")}</p>
      ) : (
        <StatLine />
      )}
    </motion.section>
  );
}

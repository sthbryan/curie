import { motion } from "motion/react";
import { Label } from "@/components/Label";
import type { Activity } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { listItem } from "@/lib/motion";

type Props = {
  event: Activity;
  lang: Lang;
};

export function RecentRow({ event, lang }: Props) {
  return (
    <motion.div
      variants={listItem}
      className="flex items-baseline gap-3 border-b border-border py-3 first:border-t"
    >
      <span className="font-mono uppercase tracking-label text-micro text-fg-3 w-16 shrink-0">
        {event.kind === "install" ? t(lang, "home.kindInstall") : t(lang, "home.kindUpdate")}
      </span>
      <span className="font-mono text-mono text-fg grow truncate">{event.skill}</span>
      <Label lang={lang} className="text-micro w-28 truncate text-right">
        {event.source ?? t(lang, "installed.local")}
      </Label>
      <Label lang={lang} className="text-micro w-20 text-right shrink-0">
        {event.when}
      </Label>
    </motion.div>
  );
}

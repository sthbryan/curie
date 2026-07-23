import { motion } from "motion/react";
import { Label } from "@/components/Label";
import type { Activity } from "@/components/types";
import { useT } from "@/i18n";
import { listItem } from "@/lib/motion";

type Props = {
  event: Activity;
};

export function RecentRow({ event }: Props) {
  const t = useT();
  return (
    <motion.div
      variants={listItem}
      className="flex items-baseline gap-3 border-b border-border py-3 first:border-t"
    >
      <span className="font-mono uppercase tracking-label text-micro text-fg-3 w-16 shrink-0">
        {event.kind === "install" ? t("home.kindInstall") : t("home.kindUpdate")}
      </span>
      <span className="font-mono text-mono text-fg grow truncate">{event.skill}</span>
      <Label className="text-micro w-28 truncate text-right">
        {event.source ?? t("installed.local")}
      </Label>
      <Label className="text-micro w-20 text-right shrink-0">{event.when}</Label>
    </motion.div>
  );
}

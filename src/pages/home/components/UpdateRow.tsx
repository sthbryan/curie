import { motion } from "motion/react";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { listItem } from "@/lib/motion";

type Props = {
  name: string;
  source: string | null;
};

export function UpdateRow({ name, source }: Props) {
  const t = useT();
  return (
    <motion.div
      variants={listItem}
      className="flex items-baseline gap-3 border-b border-border py-3 first:border-t"
    >
      <span className="font-mono uppercase tracking-label text-micro text-accent w-16 shrink-0">
        {t("home.kindUpdate")}
      </span>
      <span className="font-mono text-mono text-fg grow truncate">{name}</span>
      <Label className="text-micro w-36 truncate text-right">
        {source ?? t("installed.local")}
      </Label>
    </motion.div>
  );
}

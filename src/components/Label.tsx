import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { lang } from "@/store/system";

type Props = {
  children: string;
  className?: string;
  vars?: Record<string, string | number>;
};

export function Label({ children, className = "", vars }: Props) {
  return (
    <span className={cn("font-mono uppercase tracking-label text-micro text-fg-3", className)}>
      {t(lang.value, children, vars)}
    </span>
  );
}

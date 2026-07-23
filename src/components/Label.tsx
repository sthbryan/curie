import type { Lang } from "@/i18n";
import { t } from "@/i18n";

type Props = {
  lang: Lang;
  children: string;
  className?: string;
  vars?: Record<string, string | number>;
};

export function Label({ lang, children, className = "", vars }: Props) {
  return (
    <span className={`font-mono uppercase tracking-label text-fg-3 ${className}`}>
      {t(lang, children, vars)}
    </span>
  );
}

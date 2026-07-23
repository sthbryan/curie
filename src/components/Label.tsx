import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

type Props = {
  children: string;
  className?: string;
  vars?: Record<string, string | number>;
};

export function Label({ children, className = "", vars }: Props) {
  const t = useT();
  return (
    <span className={cn("font-mono uppercase tracking-label text-micro text-fg-3", className)}>
      {t(children, vars)}
    </span>
  );
}

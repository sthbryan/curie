import { ArrowUp } from "lucide-react";
import { useT } from "@/i18n";

type Props = {
  name: string;
  source: string | null;
};

export function UpdateRow({ name, source }: Props) {
  const t = useT();

  return (
    <div className="flex items-center gap-3 border-b border-border py-2.5 first:border-t">
      <ArrowUp
        size={12}
        strokeWidth={2}
        className="shrink-0 text-accent"
        aria-label={t("home.kindUpdate")}
      />
      <span className="grow truncate font-mono text-mono text-fg">{name}</span>
      <span className="max-w-48 truncate font-mono uppercase tracking-label text-micro text-fg-3">
        {source ?? t("installed.local")}
      </span>
    </div>
  );
}

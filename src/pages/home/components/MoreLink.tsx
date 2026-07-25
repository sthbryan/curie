import { useLocation } from "wouter";
import { useT } from "@/i18n";

type Props = {
  count: number;
  to: string;
};

export function MoreLink({ count, to }: Props) {
  const t = useT("home");
  const [, navigate] = useLocation();

  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="border-b border-border py-3 text-left font-mono uppercase tracking-label text-micro text-fg-4 transition-colors hover:text-fg"
    >
      {t("more", { n: count })}
    </button>
  );
}

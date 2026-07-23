import { ThinkingOrb } from "thinking-orbs";
import { useT } from "@/i18n";

type Props = {
  label?: string;
};

export function FullPageLoading({ label }: Props) {
  const t = useT();
  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-10">
      <ThinkingOrb state="solving" size={64} className="scale-200" />
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">
        {label ?? t("app.loading")}
      </span>
    </main>
  );
}

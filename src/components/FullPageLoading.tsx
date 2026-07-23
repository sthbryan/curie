import { ThinkingOrb } from "thinking-orbs";
import { t } from "@/i18n";
import { lang } from "@/store/system";

type Props = {
  label?: string;
};

export function FullPageLoading({ label }: Props) {
  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-10">
      <ThinkingOrb state="solving" size={64} className="scale-200" />
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">
        {label ?? t(lang.value, "app.loading")}
      </span>
    </main>
  );
}

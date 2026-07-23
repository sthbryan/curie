import type { Lang } from "@/i18n";
import { t } from "@/i18n";

type Props = {
  lang: Lang;
  /** Override the label. When omitted, uses the i18n `home.loading` key. */
  label?: string;
};

export function FullPageLoading({ lang, label }: Props) {
  return (
    <main className="flex min-w-0 flex-1 items-center justify-center">
      <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
        {label ?? t(lang, "home.loading")}
      </span>
    </main>
  );
}

import { t } from "@/i18n";
import { lang } from "@/store/system";

type Props = {
  label?: string;
};

export function FullPageLoading({ label }: Props) {
  return (
    <main className="flex min-w-0 flex-1 items-center justify-center">
      <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
        {label ?? t(lang.value, "home.loading")}
      </span>
    </main>
  );
}

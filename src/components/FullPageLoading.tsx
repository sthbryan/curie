import { Spinner } from "@zovaris/sephiro/spinner";

import { useT } from "@/i18n";

type Props = {
  label?: string;
};

export function FullPageLoading({ label }: Props) {
  const t = useT();
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-8"
    >
      <Spinner size="lg" />
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">
        {label ?? t("app.loading")}
      </span>
    </main>
  );
}

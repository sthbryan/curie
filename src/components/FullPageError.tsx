import { Button } from "@zovaris/sephiro/button";
import { Notice } from "@zovaris/sephiro/notice";

import { useT } from "@/i18n";

type Props = {
  message: string;
  onRetry: () => void;
  title?: string;
  actionLabel?: string;
};

export function FullPageError({ message, onRetry, title, actionLabel }: Props) {
  const t = useT();
  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-10">
      <div className="w-full max-w-md">
        <Notice variant="danger" title={title ?? t("home.loadError")}>
          <p className="break-all">{message}</p>
          <Button size="md" variant="primary" className="mt-3" onClick={onRetry}>
            {actionLabel ?? t("home.retry")}
          </Button>
        </Notice>
      </div>
    </main>
  );
}

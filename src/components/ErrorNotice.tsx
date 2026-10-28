import { Button } from "@zovaris/sephiro/button";
import { Notice } from "@zovaris/sephiro/notice";
import { RotateCcw } from "lucide-react";

import { useT } from "@/i18n";

type Props = {
  title: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorNotice({ title, message, onDismiss, onRetry, retryLabel }: Props) {
  const t = useT("app");

  return (
    <Notice
      variant="danger"
      title={title}
      dismissible={onDismiss !== undefined}
      onDismiss={onDismiss}
    >
      <p className="whitespace-pre-line break-all">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="secondary" className="mt-2" onClick={onRetry}>
          <RotateCcw size={10} strokeWidth={1.5} />
          {retryLabel ?? t("retry")}
        </Button>
      ) : null}
    </Notice>
  );
}

import { RotateCcw, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/Button";
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
    <div
      role="alert"
      className="flex items-start justify-between gap-4 border border-border-strong border-l-2 border-l-error bg-surface-tint px-5 py-4"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <span className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-error">
          <TriangleAlert size={12} />
          {title}
        </span>
        <p className="whitespace-pre-line break-all font-body text-sm text-fg-3">{message}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onRetry ? (
          <Button size="xs" variant="outline" onClick={onRetry}>
            <RotateCcw size={10} strokeWidth={1.5} />
            {retryLabel ?? t("retry")}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button size="xs" variant="ghost" aria-label={t("dismiss")} onClick={onDismiss}>
            <X size={12} strokeWidth={1.5} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

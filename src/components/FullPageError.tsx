import { useT } from "@/i18n";
import { Button } from "./Button";
import { Label } from "./Label";

type Props = {
  message: string;
  onRetry: () => void;
  title?: string;
  actionLabel?: string;
};

export function FullPageError({ message, onRetry, title, actionLabel }: Props) {
  const t = useT();
  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 px-10">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Label className="text-accent">{title ?? t("home.loadError")}</Label>
        <p className="font-body text-sm text-fg-3 break-all">{message}</p>
      </div>
      <Button size="lg" variant="primary" onClick={onRetry}>
        {actionLabel ?? t("home.retry")}
      </Button>
    </main>
  );
}

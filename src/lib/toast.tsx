import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export type ToastCopy = {
  label: string;
  detail?: string;
};

export type PromiseToastCopy = {
  loading: ToastCopy;
  success: ToastCopy;
  error: (e: unknown) => ToastCopy;
};

function line({ label, detail }: ToastCopy, pending = false) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {pending ? <LoaderCircle size={12} className="animate-spin shrink-0" aria-hidden /> : null}
      <span className="shrink-0">{label}</span>
      {detail ? (
        <span className="min-w-0 truncate font-body normal-case tracking-normal text-fg-3">
          {detail}
        </span>
      ) : null}
    </span>
  );
}

export function promiseToast<T>(promise: Promise<T>, copy: PromiseToastCopy): void {
  toast.promise(promise, {
    loading: line(copy.loading, true),
    success: () => line(copy.success),
    error: (e: unknown) => line(copy.error(e)),
  });
}

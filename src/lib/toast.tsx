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

function line({ label, detail }: ToastCopy) {
  return (
    <span className="flex min-w-0 items-center gap-2">
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
    loading: line(copy.loading),
    success: () => line(copy.success),
    error: (e: unknown) => line(copy.error(e)),
  });
}

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog(props: Props) {
  const {
    open,
    title,
    description,
    detail,
    confirmLabel,
    cancelLabel,
    busy = false,
    busyLabel,
    onConfirm,
    onCancel,
  } = props;

  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="presentation">
      <button
        type="button"
        aria-label={cancelLabel}
        className="absolute inset-0 bg-bg/70"
        onClick={() => {
          if (!busy) onCancel();
        }}
        tabIndex={-1}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description || detail ? descId : undefined}
        className="relative z-10 w-full max-w-sm border border-border-strong bg-surface px-5 py-5 shadow-none"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2
              id={titleId}
              className="font-mono uppercase tracking-label text-mono font-bold text-fg"
            >
              {title}
            </h2>
            {description ? (
              <p id={descId} className="font-body text-sm text-fg-3">
                {description}
                {detail ? (
                  <>
                    {" "}
                    <span className="font-mono text-mono text-fg">{detail}</span>
                  </>
                ) : null}
              </p>
            ) : detail ? (
              <p id={descId} className="font-mono text-mono text-fg">
                {detail}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} size="sm" variant="outline" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button size="sm" variant="accent" onClick={onConfirm} disabled={busy}>
              {busy && busyLabel ? busyLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

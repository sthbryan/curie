import { useEffect, useId, useRef, useState } from "react";
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
  confirmPhrase?: string;
  confirmPhraseLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
    confirmPhrase,
    confirmPhraseLabel,
    onConfirm,
    onCancel,
  } = props;

  const titleId = useId();
  const descId = useId();
  const phraseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const unlocked = !confirmPhrase || typed.trim().toUpperCase() === confirmPhrase.toUpperCase();

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (typeof document === "undefined") return null;

  const handleCancel = () => {
    if (!busy) onCancel();
  };

  return createPortal(
    <>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            data-anim="overlay"
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={handleCancel}
            aria-hidden
          />
          <div
            ref={panelRef}
            data-anim="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description || detail ? descId : undefined}
            className="relative z-10 flex w-full max-w-sm flex-col gap-5 border border-border-strong bg-surface px-5 py-5 shadow-2xl"
          >
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
                </p>
              ) : null}
              {detail ? (
                <span
                  id={description ? undefined : descId}
                  className="truncate border border-border bg-surface-tint px-2 py-1.5 font-mono text-mono text-fg"
                >
                  {detail}
                </span>
              ) : null}
            </div>
            {confirmPhrase ? (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={phraseId}
                  className="font-mono uppercase tracking-label text-micro text-fg-3"
                >
                  {confirmPhraseLabel}
                </label>
                <input
                  id={phraseId}
                  type="text"
                  value={typed}
                  onInput={(e) => setTyped((e.target as HTMLInputElement).value)}
                  disabled={busy}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={confirmPhrase}
                  className="border border-border-strong bg-bg px-2.5 py-2 font-mono uppercase tracking-label text-mono text-fg outline-none placeholder:text-fg-4 focus:border-accent"
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                ref={cancelRef}
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={busy}
              >
                {cancelLabel}
              </Button>
              <Button size="sm" variant="accent" onClick={onConfirm} disabled={busy || !unlocked}>
                {busy && busyLabel ? busyLabel : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}

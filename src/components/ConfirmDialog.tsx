import { Button } from "@zovaris/sephiro/button";
import { Dialog } from "@zovaris/sephiro/dialog";
import { Field } from "@zovaris/sephiro/field";
import { Input } from "@zovaris/sephiro/input";
import { useEffect, useId, useRef, useState } from "react";

import "@zovaris/sephiro/css/dialog.css";
import "@zovaris/sephiro/css/field.css";
import "@zovaris/sephiro/css/input.css";

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

  const phraseId = useId();
  const cancelRef = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const unlocked = !confirmPhrase || typed.trim().toUpperCase() === confirmPhrase.toUpperCase();

  const handleCancel = () => {
    if (!busy) onCancel();
  };

  const focusCancel = () => cancelRef.current?.querySelector("button") ?? null;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={title}
      description={description}
      closeLabel={cancelLabel}
      closeOnEscape={!busy}
      closeOnOverlayClick={!busy}
      initialFocus={focusCancel}
      className="max-w-sm"
      footer={
        <>
          <span ref={cancelRef} className="contents">
            <Button size="sm" variant="secondary" onClick={handleCancel} disabled={busy}>
              {cancelLabel}
            </Button>
          </span>
          <Button size="sm" variant="primary" onClick={onConfirm} disabled={busy || !unlocked}>
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {detail || confirmPhrase ? (
        <div className="flex flex-col gap-4">
          {detail ? (
            <span className="truncate border border-border bg-surface-tint px-2 py-1.5 font-mono text-mono text-fg">
              {detail}
            </span>
          ) : null}
          {confirmPhrase ? (
            <Field label={confirmPhraseLabel} htmlFor={phraseId}>
              <Input
                id={phraseId}
                type="text"
                value={typed}
                onInput={(e) => setTyped((e.target as HTMLInputElement).value)}
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
                placeholder={confirmPhrase}
                className="font-mono uppercase tracking-label"
              />
            </Field>
          ) : null}
        </div>
      ) : undefined}
    </Dialog>
  );
}

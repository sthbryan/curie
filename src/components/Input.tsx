import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { Field } from "@/components/Field";
import { cn } from "@/lib/cn";

export const CONTROL_CLASS =
  "h-10 w-full rounded-sm border border-border-strong bg-bg px-3 font-mono text-mono text-fg outline-none placeholder:text-fg-4 focus:border-fg-3";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hideLabel?: boolean;
  className?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hideLabel = false, className, wrapperClassName, id, ...inputProps },
  ref,
) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <Field id={inputId} label={label} hideLabel={hideLabel} className={wrapperClassName}>
      <input ref={ref} id={inputId} className={cn(CONTROL_CLASS, className)} {...inputProps} />
    </Field>
  );
});

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  className?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, className, wrapperClassName, ...inputProps },
  ref,
) {
  return (
    <label className={cn("relative flex min-w-0 flex-1", wrapperClassName)}>
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        className={cn(
          "h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm",
          className,
        )}
        {...inputProps}
      />
    </label>
  );
});

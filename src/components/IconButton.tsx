import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "accent" | "danger";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  children: ReactNode;
  label: string;
  variant?: Variant;
  className?: string;
};

const VARIANT: Record<Variant, string> = {
  ghost: "border-border-strong text-fg-3 hover:border-fg-3 hover:text-fg",
  accent: "border-accent/40 text-accent hover:border-accent hover:bg-accent hover:text-accent-fg",
  danger: "border-border-strong text-fg-3 hover:border-accent/50 hover:text-accent",
};

export function IconButton({
  children,
  label,
  variant = "ghost",
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono text-mono leading-none transition-colors duration-150 disabled:opacity-40",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

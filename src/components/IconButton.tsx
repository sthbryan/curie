import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";
type Variant = "ghost" | "accent" | "danger";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  children: ReactNode;
  label: string;
  variant?: Variant;
  size?: Size;
  className?: string;
};

const SIZE: Record<Size, string> = {
  xs: "h-7 w-7 text-micro",
  sm: "h-8 w-8 text-micro",
  md: "h-9 w-9 text-mono",
  lg: "h-10 w-10 text-mono",
  xl: "h-12 w-12 text-mono",
  hero: "h-14 w-14 text-mono",
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
  size = "md",
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
        "inline-flex shrink-0 items-center justify-center rounded-sm border font-mono leading-none transition-colors duration-150 disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

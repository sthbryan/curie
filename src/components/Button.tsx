import type { ButtonHTMLAttributes, ReactNode } from "react";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";
type Variant = "primary" | "accent" | "accent-outline" | "outline" | "danger" | "ghost" | "link";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  children: ReactNode;
  size?: Size;
  variant?: Variant;
  selected?: boolean;
  className?: string;
};

const SIZE: Record<Size, string> = {
  xs: "h-7 px-2.5 text-micro",
  sm: "h-8 px-3 text-micro",
  md: "h-9 px-4 text-mono",
  lg: "h-10 px-5 text-mono",
  xl: "h-12 px-6 text-mono",
  hero: "h-14 px-5 text-mono",
};

const VARIANT: Record<Variant, string> = {
  primary: "bg-fg text-bg font-bold hover:opacity-90 transition-opacity duration-150",
  accent: "bg-accent text-accent-fg font-bold hover:opacity-90 transition-opacity duration-150",
  "accent-outline":
    "border border-accent/50 text-accent hover:bg-accent hover:text-accent-fg transition-colors duration-150",
  outline:
    "border border-border-strong text-fg-2 hover:border-fg-3 hover:text-fg transition-colors duration-150",
  danger:
    "border border-border-strong text-fg-3 hover:border-accent/50 hover:text-accent transition-colors duration-150",
  ghost: "text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-150",
  link: "text-fg-3 hover:text-fg transition-colors duration-150",
};

const SELECTED = "bg-fg text-bg font-bold hover:opacity-90 transition-opacity duration-150";

export function Button({
  children,
  size = "md",
  variant = "outline",
  selected = false,
  className = "",
  type = "button",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm font-mono uppercase tracking-label disabled:opacity-50";
  const press = size === "xl" || size === "hero" ? "active:scale-[0.99]" : "";
  const visual = selected ? SELECTED : VARIANT[variant];
  return (
    <button
      type={type}
      aria-pressed={selected ? true : undefined}
      className={`${base} ${SIZE[size]} ${visual} ${press} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

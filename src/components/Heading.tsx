import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
};

export function Heading({ children, as: Tag = "h2", className = "" }: Props) {
  return (
    <Tag className={cn("font-display text-heading font-bold tracking-tight text-fg", className)}>
      {children}
    </Tag>
  );
}

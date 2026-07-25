import { cn } from "@/lib/cn";

type Props = {
  children: string;
  pulse?: boolean;
};

export function EmptyNote({ children, pulse = false }: Props) {
  return (
    <p
      className={cn(
        "border-t border-border py-3 font-body text-sm text-fg-3",
        pulse && "animate-pulse",
      )}
    >
      {children}
    </p>
  );
}

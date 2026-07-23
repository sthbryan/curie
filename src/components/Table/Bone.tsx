import { cn } from "@/lib/cn";

export function Bone({ className }: { className: string }) {
  return <div className={cn("rounded-sm bg-surface-hover", className)} />;
}

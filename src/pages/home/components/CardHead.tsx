import type { ReactNode } from "react";
import { Label } from "@/components/Label";

type Props = {
  title: string;
  meta?: ReactNode;
};

export function CardHead({ title, meta }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-7">
      <Label>{title}</Label>
      {meta}
    </div>
  );
}

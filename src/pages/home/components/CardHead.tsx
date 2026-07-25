import type { ReactNode } from "react";
import { Label } from "@/components/Label";

type Props = {
  title: string;
  meta?: ReactNode;
};

export function CardHead({ title, meta }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label>{title}</Label>
      {meta}
    </div>
  );
}

import { Skeleton } from "@zovaris/sephiro/skeleton";

import "@zovaris/sephiro/css/skeleton.css";

type Props = {
  rows?: number;
};

export function ListSkeleton({ rows = 6 }: Props) {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex h-[61px] items-center gap-6 border-b border-border first:border-t"
        >
          <Skeleton className="w-[38%]" height={12} />
          <Skeleton className="w-[26%]" height={12} />
          <Skeleton className="w-[12%]" height={12} />
          <Skeleton className="ml-auto w-16" height={12} />
        </div>
      ))}
    </div>
  );
}

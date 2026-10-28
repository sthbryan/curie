import { Badge } from "@zovaris/sephiro/badge";

import "@zovaris/sephiro/css/badge.css";

type Props = {
  label: string;
};

export function AgentBadge({ label }: Props) {
  return (
    <Badge size="sm" className="max-w-28 shrink-0 truncate">
      {label}
    </Badge>
  );
}

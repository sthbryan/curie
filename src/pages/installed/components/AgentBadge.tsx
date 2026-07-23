type Props = {
  label: string;
};

export function AgentBadge({ label }: Props) {
  return (
    <span className="inline-flex max-w-36 truncate border border-border px-1.5 py-0.5 font-mono uppercase tracking-label text-micro text-fg-3">
      {label}
    </span>
  );
}

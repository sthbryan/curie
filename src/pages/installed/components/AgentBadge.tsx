type Props = {
  label: string;
};

export function AgentBadge({ label }: Props) {
  return (
    <span className="inline-block max-w-28 truncate border border-border px-1 py-0.5 font-mono uppercase tracking-label text-micro text-fg-3 h-fit">
      {label}
    </span>
  );
}

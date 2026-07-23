type Props = {
  label: string;
  value: string;
};

export function SystemRow({ label, value }: Props) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-3">
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">{label}</span>
      <span className="font-mono text-mono text-fg truncate max-w-md text-right">{value}</span>
    </div>
  );
}

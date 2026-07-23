type Props = {
  number: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

export function NavItem({ number, label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex w-full flex-col items-start gap-1 rounded-sm px-3 py-2.5 text-left transition-colors duration-150 ${
        active ? "bg-surface-tint text-fg" : "text-fg-3 hover:bg-surface-hover hover:text-fg"
      }`}
    >
      <span
        className={`font-mono text-micro leading-none tabular-nums ${
          active ? "text-fg-3" : "text-fg-4 group-hover:text-fg-3"
        }`}
      >
        {number}
      </span>
      <span
        className={`font-mono uppercase tracking-label text-mono leading-none ${
          active ? "font-bold text-fg" : ""
        }`}
      >
        {label}
      </span>
    </button>
  );
}

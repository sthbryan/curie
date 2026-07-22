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
      className={`group relative flex h-12 flex-col items-start justify-center gap-0.5 px-4 transition-colors duration-150 ${
        active ? "text-fg" : "text-fg-3 hover:text-fg"
      }`}
    >
      <span
        className={`font-mono text-micro leading-none ${
          active ? "text-fg-3" : "text-fg-4 group-hover:text-fg-3"
        }`}
      >
        {number}
      </span>
      <span
        className={`font-mono uppercase tracking-label text-mono leading-none ${
          active ? "font-bold" : ""
        }`}
      >
        {label}
      </span>
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-fg" />}
    </button>
  );
}

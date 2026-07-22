type Props = {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
  isLast?: boolean;
};

export function ChoiceButton({ active, label, sublabel, onClick, isLast = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 items-center justify-center gap-2 px-4 font-mono uppercase tracking-label text-mono transition-colors duration-150 ${
        active
          ? "bg-fg text-bg font-bold"
          : `border border-border-strong text-fg-2 hover:border-fg-3 hover:text-fg ${isLast ? "border-l-0" : ""}`
      }`}
    >
      <span>{label}</span>
      {sublabel && (
        <span
          className={`font-mono uppercase tracking-label text-micro ${
            active ? "text-bg opacity-60" : "text-fg-4"
          }`}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

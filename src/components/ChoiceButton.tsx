import { cn } from "@/lib/cn";

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
      className={cn(
        "flex h-9 items-center justify-center gap-2 px-4 font-mono uppercase tracking-label text-mono transition-colors duration-150",
        {
          "bg-fg text-bg font-bold": active,
          "border border-border-strong text-fg-2 hover:border-fg-3 hover:text-fg": !active,
          "border-l-0": !active && isLast,
        },
      )}
    >
      <span>{label}</span>
      {sublabel && (
        <span
          className={cn(
            "font-mono uppercase tracking-label text-micro",
            active ? "text-bg opacity-60" : "text-fg-4",
          )}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

import { cn } from "@/lib/cn";

type Props = {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
};

export function ChoiceButton({ active, label, sublabel, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "-ml-px flex h-8 items-center justify-center gap-2 px-4 font-mono uppercase tracking-label text-mono transition-colors duration-150 first:ml-0",
        {
          "relative bg-fg text-bg font-bold": active,
          "border border-border-strong text-fg-2 hover:border-fg-3 hover:text-fg": !active,
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

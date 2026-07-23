import type { ThemeMode } from "@/components/types";

type Props = {
  id: ThemeMode;
  active: boolean;
  label: string;
  hint: string;
  swatches: [string, string, string];
  onClick: () => void;
};

export function ThemeCard({ id, active, label, hint, swatches, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-theme-option={id}
      className={`flex flex-col gap-3 border p-4 text-left transition-colors duration-150 rounded-sm ${
        active
          ? "border-fg bg-surface-tint"
          : "border-border-strong hover:border-fg-3 hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {swatches.map((color) => (
          <span
            key={`${id}-${color}`}
            className="h-5 w-5 rounded-sm border border-border-strong"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className={`font-mono uppercase tracking-label text-mono ${
            active ? "text-fg font-bold" : "text-fg-2"
          }`}
        >
          {label}
        </span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">{hint}</span>
      </div>
    </button>
  );
}

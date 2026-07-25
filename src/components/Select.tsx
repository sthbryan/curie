import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes, useId } from "react";
import { Field } from "@/components/Field";
import { CONTROL_CLASS } from "@/components/Input";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> & {
  label: string;
  options: SelectOption[];
  hideLabel?: boolean;
  className?: string;
  wrapperClassName?: string;
};

export function Select({
  label,
  options,
  hideLabel = false,
  className,
  wrapperClassName,
  id,
  ...selectProps
}: Props) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;

  return (
    <Field id={selectId} label={label} hideLabel={hideLabel} className={wrapperClassName}>
      <div className="relative flex min-w-0">
        <select
          id={selectId}
          className={cn(CONTROL_CLASS, "cursor-pointer appearance-none pr-9", className)}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-4"
          aria-hidden
        />
      </div>
    </Field>
  );
}

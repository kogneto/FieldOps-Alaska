import { Minus, Plus } from "lucide-react";

// A glove-friendly − value + control, used for trip dates instead of a calendar.
export function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  minusDisabled = false,
  plusDisabled = false,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  const button =
    "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card text-foreground active:bg-secondary disabled:opacity-40";
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={button}
          onClick={onMinus}
          disabled={minusDisabled}
          aria-label={`${label}: less`}
        >
          <Minus className="h-6 w-6" strokeWidth={3} />
        </button>
        <div
          className="flex min-h-16 flex-1 items-center justify-center rounded-lg bg-secondary px-3 text-center text-lg font-bold"
          aria-live="polite"
        >
          {value}
        </div>
        <button
          type="button"
          className={button}
          onClick={onPlus}
          disabled={plusDisabled}
          aria-label={`${label}: more`}
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

/**
 * A compact dropdown multi-select used in the spreadsheet filter bar.
 * Mirrors the legacy checkbox-dropdown behaviour (summary text + outside click).
 */
export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  allLabel,
  className,
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} ${label.toLowerCase()} selected`;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full min-w-[11rem] items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted/50"
      >
        <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>
          {summary}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="surface-card absolute z-20 mt-1 max-h-64 w-full min-w-[12rem] overflow-y-auto rounded-lg border p-1 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No options</p>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border',
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

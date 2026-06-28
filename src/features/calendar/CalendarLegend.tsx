import { cn } from '@/lib/utils';
import { STATUS_ORDER, statusColor, statusLabel } from '@/lib/status';
import { CYCLE_WINDOW_COLORS, CYCLE_WINDOW_LABELS } from './events';

/**
 * Status legend for posting events, plus the cycle-window legend shown only when
 * cycle view is enabled.
 */
export function CalendarLegend({ showCycle }: { showCycle: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {STATUS_ORDER.map((status) => (
        <LegendItem key={status} color={statusColor(status).hex} label={statusLabel(status)} />
      ))}
      {showCycle && (
        <>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {(Object.keys(CYCLE_WINDOW_COLORS) as Array<keyof typeof CYCLE_WINDOW_COLORS>).map(
            (key) => (
              <LegendItem
                key={key}
                color={CYCLE_WINDOW_COLORS[key]}
                label={CYCLE_WINDOW_LABELS[key]}
                muted
              />
            ),
          )}
        </>
      )}
    </div>
  );
}

function LegendItem({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn('inline-block size-3 rounded-[4px]', muted && 'opacity-60')}
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

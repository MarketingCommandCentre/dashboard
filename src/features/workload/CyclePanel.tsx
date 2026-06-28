import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, CalendarClock, Clock } from 'lucide-react';
import { useWorkload } from '@/hooks/useWorkload';
import { computeCycleWindows, CYCLE_LENGTH_DAYS } from '@/lib/cycle';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { CycleInfo } from '@/types';
import { isRecord } from './shape';

/** The workload hook is loosely typed; coerce cycle-info into a CycleInfo shape. */
function asCycleInfo(data: unknown): CycleInfo | null {
  return isRecord(data) ? (data as CycleInfo) : null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function CyclePanel({ delay = 0 }: { delay?: number }) {
  const { data, isLoading, isError } = useWorkload('cycle-info');

  // Always computable: backend info when present, else the local calendar fallback.
  const windows = useMemo(() => computeCycleWindows(asCycleInfo(data)), [data]);

  const { current, next } = windows;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="surface-card flex flex-col gap-4 rounded-[28px] border p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarRange className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Current Cycle</h2>
            <p className="text-[11px] text-muted-foreground">
              {isError ? 'Using local estimate' : `${CYCLE_LENGTH_DAYS}-day development window`}
            </p>
          </div>
        </div>
        <Badge variant="default" className="shrink-0">
          Cycle {current.cycleNumber}
        </Badge>
      </header>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
      ) : (
        <div className="space-y-4">
          {/* Development window + progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="size-3.5 text-primary" />
                Development
              </span>
              <span className="text-muted-foreground">
                {formatDate(current.developmentStart)} – {formatDate(current.developmentEnd)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full bg-primary transition-all')}
                style={{ width: `${current.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {current.daysElapsed} of {current.totalDays} days ({current.progress}%)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Days Remaining" value={String(current.daysRemaining)} />
            <Stat label="Cycle Ends" value={formatDate(current.developmentEnd)} />
          </div>

          {/* Next cycle + posting window */}
          <div className="rounded-2xl border border-dashed p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <CalendarClock className="size-3.5 text-primary" />
                Next Cycle {next.cycleNumber}
              </span>
              <span className="text-[11px] text-muted-foreground">
                starts in {next.daysUntilStart} day{next.daysUntilStart === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatDate(next.developmentStart)} – {formatDate(next.developmentEnd)}
            </p>
            <div className="mt-2 border-t pt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Posting Window
              </p>
              <p className="mt-0.5 text-xs">
                {formatDate(next.postingStart)} – {formatDate(next.postingEnd)}
                <span className="text-muted-foreground"> · in {next.daysUntilPosting} days</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

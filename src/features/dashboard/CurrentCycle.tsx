import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { computeCycleWindows } from '@/lib/cycle';
import { useWorkload } from '@/hooks/useWorkload';
import type { CycleInfo } from '@/types';

export function CurrentCycle() {
  const { data, isLoading, isError } = useWorkload('cycle-info');

  const windows = useMemo(
    () => computeCycleWindows((data as CycleInfo | undefined) ?? null),
    [data],
  );

  return (
    <Card className="surface-card flex h-full flex-col border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          Current Cycle
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading cycle info…</p>
        ) : (
          <>
            {isError && (
              <p className="text-xs text-muted-foreground">
                Using local cycle calculation (backend unavailable).
              </p>
            )}
            {/* Current + next cycle side by side when the card is full width. */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-8">
              {/* Current development cycle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    🎨 Development
                  </span>
                  <span className="text-sm font-semibold">Cycle {windows.current.cycleNumber}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  📅 {formatDate(windows.current.developmentStart)} –{' '}
                  {formatDate(windows.current.developmentEnd)}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${windows.current.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {windows.current.daysElapsed} of {windows.current.totalDays} days (
                  {windows.current.progress}%)
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Stat label="Days Remaining" value={String(windows.current.daysRemaining)} />
                  <Stat label="Task Day" value={formatDate(windows.current.developmentEnd)} />
                </div>
              </div>

              {/* Next cycle */}
              <div className="space-y-2 border-t pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    ⏭️ Next Cycle
                  </span>
                  <span className="text-sm font-semibold">Cycle {windows.next.cycleNumber}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  📅 {formatDate(windows.next.developmentStart)} –{' '}
                  {formatDate(windows.next.developmentEnd)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Starts In" value={`${windows.next.daysUntilStart} days`} />
                  <Stat label="Duration" value="14 days" />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs">
                  <p className="font-medium">📅 Posting Window</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatDate(windows.next.postingStart)} – {formatDate(windows.next.postingEnd)}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Content from this cycle is posted during this window (
                    {windows.next.daysUntilPosting} days from now).
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

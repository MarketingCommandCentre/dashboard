import { Scale, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';

import type { LoadBalanceReport } from './loadBalance';

const VERDICT_STYLES: Record<LoadBalanceReport['verdict'], string> = {
  Excellent: 'text-[#27ae60]',
  Good: 'text-[#3498db]',
  Fair: 'text-[#f39c12]',
  Poor: 'text-[#e74c3c]',
};

/**
 * LoadBalance™ sidebar: overall evenness score for the visible month plus a
 * per-week load breakdown, so heavy weeks are obvious while dragging.
 */
export function LoadBalancePanel({
  report,
  monthLabel,
  saving,
  error,
}: {
  report: LoadBalanceReport;
  monthLabel: string;
  saving: boolean;
  error: string | null;
}) {
  const maxCount = Math.max(1, ...report.weeks.map((w) => w.count));

  return (
    <Card className="surface-card flex h-fit w-full flex-col gap-4 p-4 lg:w-72 lg:shrink-0">
      <div className="flex items-center gap-2">
        <Scale className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          LoadBalance™ <span className="font-normal text-muted-foreground">· {monthLabel}</span>
        </h3>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-4xl font-bold tabular-nums', VERDICT_STYLES[report.verdict])}>
          {report.score}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className={cn('ml-auto text-sm font-semibold', VERDICT_STYLES[report.verdict])}>
          {report.verdict}
        </span>
      </div>

      <div className="space-y-2">
        {report.weeks.map((week) => (
          <div key={week.start.getTime()} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn('text-muted-foreground', week.heavy && 'font-semibold text-[#e74c3c]')}>
                {week.label}
                {week.heavy && ' · heavy'}
              </span>
              <span className="font-semibold tabular-nums">{week.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  week.heavy ? 'bg-[#e74c3c]' : 'bg-primary',
                )}
                style={{ width: `${(week.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5" />
          {report.totalPosts} post{report.totalPosts === 1 ? '' : 's'} scheduled this month
        </p>
        {report.busiestDay && report.busiestDay.count > 1 && (
          <p>
            Busiest day: <span className="font-medium text-foreground">{formatDate(report.busiestDay.date)}</span>{' '}
            ({report.busiestDay.count} posts)
          </p>
        )}
        <p>Drag posts between days to rebalance — changes save immediately.</p>
      </div>

      {saving && <p className="text-xs font-medium text-primary">Saving…</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </Card>
  );
}

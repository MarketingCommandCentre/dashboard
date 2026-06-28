import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/dates';
import { statusColor } from '@/lib/status';
import type { Request } from '@/types';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MiniCalendar({ requests }: { requests: Request[] }) {
  const { cells, monthCount, upcomingCount, monthName } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const label = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();
    const todayMidnight = new Date(year, month, today.getDate());

    const byDay = new Map<number, Request[]>();
    let monthTotal = 0;
    let upcoming = 0;
    for (const r of requests) {
      const due = parseLocalDate(r.postingDate);
      if (!due) continue;
      if (due.getFullYear() === year && due.getMonth() === month) {
        monthTotal++;
        const day = due.getDate();
        const list = byDay.get(day) ?? [];
        list.push(r);
        byDay.set(day, list);
      }
      const isDone = r.status === 'DONE';
      const isBlocked = r.status === 'BLOCKED';
      if (due >= todayMidnight && !isDone && !isBlocked) upcoming++;
    }

    const grid: Array<{
      day: number | null;
      isToday: boolean;
      events: Request[];
    }> = [];
    for (let i = 0; i < startOffset; i++) grid.push({ day: null, isToday: false, events: [] });
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({
        day,
        isToday: day === today.getDate(),
        events: byDay.get(day) ?? [],
      });
    }
    return { cells: grid, monthCount: monthTotal, upcomingCount: upcoming, monthName: label };
  }, [requests]);

  return (
    <Card className="surface-card flex h-full flex-col border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-5">
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">{monthName}</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell.day === null) return <div key={`e${i}`} />;
            const titles = cell.events
              .map((e) => e.title || 'Untitled request')
              .join('\n');
            return (
              <div
                key={cell.day}
                title={titles || undefined}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs',
                  cell.isToday ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground',
                  cell.events.length > 0 && !cell.isToday && 'bg-muted/40',
                )}
              >
                <span>{cell.day}</span>
                {cell.events.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {cell.events.slice(0, 3).map((e, di) => (
                      <span
                        key={di}
                        className="size-1 rounded-full"
                        style={{ backgroundColor: statusColor(e.status).hex }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>📌 {upcomingCount} upcoming</span>
          <span>📋 {monthCount} this month</span>
        </div>
      </CardContent>
    </Card>
  );
}

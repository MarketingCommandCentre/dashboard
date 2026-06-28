import { isOverdue } from '@/lib/dates';
import type { Request } from '@/types';

function computeStats(requests: Request[]) {
  let pending = 0;
  let completed = 0;
  let overdue = 0;
  for (const request of requests) {
    if (request.status === 'DONE') completed += 1;
    else pending += 1;
    if (isOverdue(request.postingDate, request.status)) overdue += 1;
  }
  return { total: requests.length, pending, completed, overdue };
}

export function SummaryPanel({ requests }: { requests: Request[] }) {
  const stats = computeStats(requests);
  const items: { label: string; value: number; danger?: boolean }[] = [
    { label: 'Total', value: stats.total },
    { label: 'Pending', value: stats.pending },
    { label: 'Completed', value: stats.completed },
    { label: 'Overdue', value: stats.overdue, danger: stats.overdue > 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-muted/70 px-3 py-3">
          <p className={`text-xl font-extrabold ${item.danger ? 'text-destructive' : ''}`}>
            {item.value}
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

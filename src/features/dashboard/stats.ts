import { isOverdue } from '@/lib/dates';
import type { Request } from '@/types';

export interface OverviewStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

/**
 * Overview counts for the dashboard stat cards.
 * - completed: status === DONE
 * - pending: everything not DONE
 * - overdue: posting date in the past and not DONE (see isOverdue)
 */
export function computeOverviewStats(requests: Request[]): OverviewStats {
  const stats: OverviewStats = { total: requests.length, pending: 0, completed: 0, overdue: 0 };
  for (const r of requests) {
    if (r.status === 'DONE') stats.completed++;
    else stats.pending++;
    if (isOverdue(r.postingDate, r.status)) stats.overdue++;
  }
  return stats;
}

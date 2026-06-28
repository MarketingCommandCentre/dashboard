import { differenceInCalendarDays, format } from 'date-fns';
import { parseLocalDate } from '@/lib/dates';
import { STATUS_ORDER, statusColor, statusLabel } from '@/lib/status';
import type { Request, RequestStatus, RequestType } from '@/types';

export const PERIOD_OPTIONS = [7, 30, 90] as const;
export type Period = (typeof PERIOD_OPTIONS)[number];

export interface StatusDatum {
  status: RequestStatus;
  label: string;
  count: number;
  hex: string;
}

export interface TimelineDatum {
  /** yyyy-MM-dd */
  date: string;
  /** Short display label, e.g. "Jun 27". */
  label: string;
  count: number;
}

export interface TypeDatum {
  type: RequestType;
  count: number;
}

export interface PerformanceMetrics {
  /** Average createdAt→updatedAt for DONE requests, in days (null when none). */
  avgCompletionDays: number | null;
  /** DONE / total, 0–100. */
  successRate: number;
  /** Weekday name with the most created requests, or null. */
  peakActivityDay: string | null;
  completedCount: number;
  totalCount: number;
}

/** Count of requests per status, in display order, with chart colors. */
export function statusDistribution(requests: Request[]): StatusDatum[] {
  const counts = new Map<RequestStatus, number>();
  for (const req of requests) {
    if (!req.status) continue;
    counts.set(req.status, (counts.get(req.status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map((status) => ({
    status,
    label: statusLabel(status),
    count: counts.get(status) ?? 0,
    hex: statusColor(status).hex,
  }));
}

/** POST vs REEL counts (always returns both rows). */
export function typeDistribution(requests: Request[]): TypeDatum[] {
  const counts: Record<RequestType, number> = { POST: 0, REEL: 0 };
  for (const req of requests) {
    if (req.requestType === 'POST' || req.requestType === 'REEL') {
      counts[req.requestType] += 1;
    }
  }
  return [
    { type: 'POST', count: counts.POST },
    { type: 'REEL', count: counts.REEL },
  ];
}

/**
 * DONE requests completed per day (by updatedAt) for the last `period` days,
 * including zero-count days so the line is continuous.
 */
export function completionTimeline(
  requests: Request[],
  period: Period,
  reference: Date = new Date(),
): TimelineDatum[] {
  const end = new Date(reference);
  end.setHours(0, 0, 0, 0);

  const perDay = new Map<string, number>();
  for (const req of requests) {
    if (req.status !== 'DONE') continue;
    const completed = parseLocalDate(req.updatedAt);
    if (!completed) continue;
    const diff = differenceInCalendarDays(end, completed);
    if (diff < 0 || diff >= period) continue;
    const key = format(completed, 'yyyy-MM-dd');
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const result: TimelineDatum[] = [];
  for (let i = period - 1; i >= 0; i -= 1) {
    const day = new Date(end);
    day.setDate(end.getDate() - i);
    const key = format(day, 'yyyy-MM-dd');
    result.push({ date: key, label: format(day, 'MMM d'), count: perDay.get(key) ?? 0 });
  }
  return result;
}

/** Requests created within the last `period` days. */
function withinPeriod(requests: Request[], period: Period, reference: Date): Request[] {
  const end = new Date(reference);
  end.setHours(0, 0, 0, 0);
  return requests.filter((req) => {
    const created = parseLocalDate(req.createdAt);
    if (!created) return false;
    const diff = differenceInCalendarDays(end, created);
    return diff >= 0 && diff < period;
  });
}

/** Performance metrics over the requests created in the selected period. */
export function performanceMetrics(
  requests: Request[],
  period: Period,
  reference: Date = new Date(),
): PerformanceMetrics {
  const scoped = withinPeriod(requests, period, reference);
  const total = scoped.length;
  const done = scoped.filter((req) => req.status === 'DONE');

  let durationSum = 0;
  let durationCount = 0;
  for (const req of done) {
    const created = parseLocalDate(req.createdAt);
    const updated = parseLocalDate(req.updatedAt);
    if (!created || !updated) continue;
    const days = (updated.getTime() - created.getTime()) / 86_400_000;
    if (days < 0) continue;
    durationSum += days;
    durationCount += 1;
  }

  const weekdayCounts = new Map<string, number>();
  for (const req of scoped) {
    const created = parseLocalDate(req.createdAt);
    if (!created) continue;
    const weekday = format(created, 'EEEE');
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
  }
  let peakActivityDay: string | null = null;
  let peakCount = -1;
  for (const [weekday, count] of weekdayCounts) {
    if (count > peakCount) {
      peakCount = count;
      peakActivityDay = weekday;
    }
  }

  return {
    avgCompletionDays: durationCount > 0 ? durationSum / durationCount : null,
    successRate: total > 0 ? Math.round((done.length / total) * 100) : 0,
    peakActivityDay,
    completedCount: done.length,
    totalCount: total,
  };
}

import { addDays, format, isBefore, startOfWeek } from 'date-fns';
import { parseLocalDate } from '@/lib/dates';
import type { Request } from '@/types';

/**
 * LoadBalance™ scoring.
 *
 * Measures how evenly posts are spread across the visible month. Two signals:
 *  - Weekly evenness: coefficient of variation of posts-per-week. A month where
 *    every week carries a similar share scores high.
 *  - Day clustering: stacking several posts on one day is penalized
 *    quadratically, normalized by the number of posts.
 * The overall score blends both (weeks weigh more — that's the planning unit).
 */

export type DayLoadLevel = 'light' | 'moderate' | 'busy' | 'overloaded';

export interface WeekLoad {
  /** Week start (Sunday, matching the calendar's firstDay). */
  start: Date;
  label: string;
  count: number;
  /** Share of the month's posts carried by this week, 0..1. */
  share: number;
  /** Over 125% of the mean weekly load. */
  heavy: boolean;
}

export interface LoadBalanceReport {
  totalPosts: number;
  /** 0 (all posts piled up) .. 100 (perfectly even). */
  score: number;
  verdict: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  /** yyyy-MM-dd -> number of posts that day (visible range, not just the month). */
  dayCounts: Record<string, number>;
  weeks: WeekLoad[];
  busiestDay: { date: string; count: number } | null;
}

/** Heat level for a day, used for the calendar cell tint. */
export function dayLoadLevel(count: number): DayLoadLevel | null {
  if (count <= 0) return null;
  if (count === 1) return 'light';
  if (count === 2) return 'moderate';
  if (count === 3) return 'busy';
  return 'overloaded';
}

function verdictFor(score: number): LoadBalanceReport['verdict'] {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Build the report for the calendar's current window.
 *
 * @param rangeStart inclusive — the month being scored (view.currentStart)
 * @param rangeEnd   exclusive — (view.currentEnd)
 */
export function buildLoadBalanceReport(
  requests: Request[],
  rangeStart: Date,
  rangeEnd: Date,
): LoadBalanceReport {
  // Count every scheduled post per day (all statuses — the calendar shows the
  // posting schedule, and published posts still occupied their slot).
  const dayCounts: Record<string, number> = {};
  const inRangeCounts: Record<string, number> = {};
  const inRange: Date[] = [];
  for (const req of requests) {
    const date = parseLocalDate(req.postingDate);
    if (!date) continue;
    const key = format(date, 'yyyy-MM-dd');
    dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    if (!isBefore(date, rangeStart) && isBefore(date, rangeEnd)) {
      inRange.push(date);
      inRangeCounts[key] = (inRangeCounts[key] ?? 0) + 1;
    }
  }

  // Bucket the in-range posts into Sunday-anchored weeks.
  const weekCounts = new Map<number, { start: Date; count: number }>();
  for (
    let cursor = startOfWeek(rangeStart, { weekStartsOn: 0 });
    isBefore(cursor, rangeEnd);
    cursor = addDays(cursor, 7)
  ) {
    weekCounts.set(cursor.getTime(), { start: cursor, count: 0 });
  }
  for (const date of inRange) {
    const key = startOfWeek(date, { weekStartsOn: 0 }).getTime();
    const bucket = weekCounts.get(key);
    if (bucket) bucket.count += 1;
  }

  const totalPosts = inRange.length;
  const buckets = Array.from(weekCounts.values());

  let busiestDay: LoadBalanceReport['busiestDay'] = null;
  for (const [key, count] of Object.entries(inRangeCounts)) {
    if (!busiestDay || count > busiestDay.count) {
      busiestDay = { date: key, count };
    }
  }

  if (totalPosts === 0) {
    return {
      totalPosts: 0,
      score: 100,
      verdict: 'Excellent',
      dayCounts,
      weeks: buckets.map((b) => ({
        start: b.start,
        label: weekLabel(b.start),
        count: 0,
        share: 0,
        heavy: false,
      })),
      busiestDay: null,
    };
  }

  // Weekly evenness: 1 - coefficient of variation, floored at 0.
  const mean = totalPosts / buckets.length;
  const variance =
    buckets.reduce((sum, b) => sum + (b.count - mean) ** 2, 0) / buckets.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const weekScore = Math.max(0, 1 - cv);

  // Day clustering: each extra post on an already-taken day costs (n-1)²,
  // normalized so "every post on one day" tends toward 0.
  const clusterPenalty = Object.values(inRangeCounts).reduce(
    (sum, n) => sum + (n - 1) ** 2,
    0,
  );
  const worstCase = (totalPosts - 1) ** 2 || 1;
  const dayScore = Math.max(0, 1 - clusterPenalty / worstCase);

  const score = Math.round((0.6 * weekScore + 0.4 * dayScore) * 100);

  const weeks: WeekLoad[] = buckets.map((b) => ({
    start: b.start,
    label: weekLabel(b.start),
    count: b.count,
    share: b.count / totalPosts,
    heavy: b.count > mean * 1.25 && b.count >= 2,
  }));

  return { totalPosts, score, verdict: verdictFor(score), dayCounts, weeks, busiestDay };
}

function weekLabel(weekStart: Date): string {
  return `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d')}`;
}

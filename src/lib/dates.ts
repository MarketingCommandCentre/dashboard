import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  differenceInCalendarDays,
} from 'date-fns';
import type { RequestStatus } from '@/types';

/**
 * Parse a backend date string. Plain `yyyy-MM-dd` values are anchored at local
 * midnight to avoid the timezone shift the legacy app guarded against; full
 * ISO date-times are parsed as-is.
 */
export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const str = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = parseISO(str);
  return isValid(date) ? date : null;
}

/** e.g. "Jun 27, 2026". Returns an em dash for missing/invalid input. */
export function formatDate(value: string | null | undefined): string {
  const date = parseLocalDate(value);
  return date ? format(date, 'MMM d, yyyy') : '—';
}

/** e.g. "Jun 27, 2026, 3:04 PM". */
export function formatDateTime(value: string | null | undefined): string {
  const date = parseLocalDate(value);
  return date ? format(date, 'MMM d, yyyy, h:mm a') : '—';
}

/** e.g. "3 days ago". */
export function relativeTime(value: string | null | undefined): string {
  const date = parseLocalDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '—';
}

/**
 * True when the posting date is in the past and the request is not already
 * DONE. Returns false if there is no posting date.
 */
export function isOverdue(
  postingDate: string | null | undefined,
  status: RequestStatus | undefined,
): boolean {
  if (status === 'DONE') return false;
  const due = parseLocalDate(postingDate);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(due, today) < 0;
}

/** Whole days until the posting date (negative if overdue), or null. */
export function daysUntil(postingDate: string | null | undefined): number | null {
  const due = parseLocalDate(postingDate);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(due, today);
}

export function currentMonthRange(reference: Date = new Date()): { start: Date; end: Date } {
  return { start: startOfMonth(reference), end: endOfMonth(reference) };
}

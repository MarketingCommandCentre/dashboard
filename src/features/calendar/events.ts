import type { EventInput } from '@fullcalendar/core';
import type { CycleWindows } from '@/lib/cycle';
import type { Request } from '@/types';
import { statusColor } from '@/lib/status';
import { parseLocalDate } from '@/lib/dates';

/** Distinct colors for the three cycle background windows. */
export const CYCLE_WINDOW_COLORS = {
  request: '#8b5cf6', // violet
  production: '#f97316', // orange
  posting: '#14b8a6', // teal
} as const;

export const CYCLE_WINDOW_LABELS = {
  request: 'Request Window',
  production: 'Production Window',
  posting: 'Posting Window',
} as const;

/**
 * Build one FullCalendar event per request that has a posting date. The event
 * is colored by the request status and carries the request id so a click can
 * reopen the detail dialog.
 */
export function buildRequestEvents(requests: Request[]): EventInput[] {
  return requests
    .filter((req) => !!req.postingDate)
    .map((req) => {
      const color = statusColor(req.status).hex;
      return {
        id: `request-${req.channelID}`,
        title: req.title || 'Untitled request',
        start: req.postingDate,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { channelID: req.channelID },
      } satisfies EventInput;
    });
}

/**
 * FullCalendar treats `end` as exclusive, so a window ending on `developmentEnd`
 * must extend one day past it to render the final day.
 */
function exclusiveEnd(ymd: string): string | undefined {
  const date = parseLocalDate(ymd);
  if (!date) return undefined;
  date.setDate(date.getDate() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Overlay the request / production / posting windows derived from the current
 * and next development cycles as FullCalendar background events. This reproduces
 * the legacy cycle-highlight feature.
 *
 * Mapping (matches legacy main-calendar.js, forward direction):
 *  - request window     = current development cycle
 *  - production window  = next development cycle
 *  - posting window     = the posting window that follows the next cycle
 */
export function buildCycleBackgroundEvents(windows: CycleWindows): EventInput[] {
  const segments = [
    {
      key: 'request' as const,
      start: windows.current.developmentStart,
      end: windows.current.developmentEnd,
    },
    {
      key: 'production' as const,
      start: windows.next.developmentStart,
      end: windows.next.developmentEnd,
    },
    {
      key: 'posting' as const,
      start: windows.next.postingStart,
      end: windows.next.postingEnd,
    },
  ];

  return segments.map((segment) => ({
    id: `cycle-${segment.key}`,
    display: 'background',
    start: segment.start,
    end: exclusiveEnd(segment.end),
    title: CYCLE_WINDOW_LABELS[segment.key],
    color: CYCLE_WINDOW_COLORS[segment.key],
  }));
}

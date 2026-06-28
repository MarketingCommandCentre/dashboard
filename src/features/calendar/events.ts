import type { EventInput } from '@fullcalendar/core';
import type { Request } from '@/types';
import { statusColor } from '@/lib/status';

/** Colors for the three rolling cycle windows (match the hover highlight). */
export const CYCLE_WINDOW_COLORS = {
  request: '#87ceeb', // light blue
  production: '#ffd700', // gold
  posting: '#90ee90', // light green
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

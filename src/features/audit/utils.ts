import type { AuditEvent, DiscordNameMap } from '@/types';

/** Sentinel id used by the backend for actions performed by the bot itself. */
export const BOT_ID = '0';

/** Display label shown for events performed by the bot. */
export const BOT_LABEL = 'Bot';

/** Value used by the filter selects to represent "no filter / show all". */
export const ALL_VALUE = '__all__';

/**
 * Resolve a `performedBy` user id to a human-readable name.
 * - id `0` is the bot.
 * - a resolved Discord nickname wins when available.
 * - an unresolved numeric snowflake falls back to its last four digits.
 * - anything else is returned as-is.
 */
export function performerName(
  performedBy: string | number | null | undefined,
  names: DiscordNameMap | undefined,
): string {
  if (performedBy === null || performedBy === undefined || performedBy === '') {
    return 'Unknown';
  }
  const id = String(performedBy);
  if (id === BOT_ID) return BOT_LABEL;
  const resolved = names?.[id];
  if (resolved) return resolved;
  if (/^\d+$/.test(id)) return `User #${id.slice(-4)}`;
  return id;
}

/** Badge variant for an event type, grouped by the kind of mutation. */
export function eventTypeVariant(
  eventType: string | null | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const type = (eventType ?? '').toLowerCase();
  if (type.includes('create') || type.includes('add')) return 'default';
  if (type.includes('delete') || type.includes('remove')) return 'destructive';
  if (
    type.includes('update') ||
    type.includes('modify') ||
    type.includes('edit') ||
    type.includes('change')
  ) {
    return 'secondary';
  }
  return 'outline';
}

/** Distinct, sorted, non-empty values of a string field across events. */
export function distinctValues(
  events: AuditEvent[],
  field: 'eventType' | 'entityType',
): string[] {
  const set = new Set<string>();
  for (const event of events) {
    const value = event[field];
    if (value) set.add(value);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Count of events per event type, sorted by descending count. */
export function eventTypeCounts(events: AuditEvent[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const type = event.eventType || 'Unknown';
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

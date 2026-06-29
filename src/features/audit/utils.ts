import type { AuditEvent, DiscordNameMap } from '@/types';

/** Legacy sentinel id once used by the backend for bot-performed actions. */
export const BOT_ID = '0';

/** Display label shown for events performed by the bot. */
export const BOT_LABEL = 'Bot';

/** Value used by the filter selects to represent "no filter / show all". */
export const ALL_VALUE = '__all__';

export type PerformerKind = 'user' | 'bot' | 'bot_on_behalf';

export interface ParsedPerformer {
  kind: PerformerKind;
  /** Discord user id, for `user` and `bot_on_behalf` performers. */
  userId?: string;
  /** Bot identifier, for `bot` and `bot_on_behalf` performers. */
  botId?: string;
}

/**
 * Parse the backend `performedBy` value, which is `Actor.format()`:
 *   - `"user:123"`                          → user
 *   - `"bot:discord-bot"`                    → bot
 *   - `"bot:discord-bot;on-behalf-of:123"`   → bot acting for a user
 * Falls back gracefully for legacy values (bare snowflake, or `"0"` for the bot).
 */
export function parsePerformedBy(
  performedBy: string | number | null | undefined,
): ParsedPerformer {
  const raw = String(performedBy ?? '').trim();

  if (raw.startsWith('bot:')) {
    const [botPart, oboPart] = raw.split(';');
    const botId = botPart.slice('bot:'.length) || undefined;
    if (oboPart && oboPart.startsWith('on-behalf-of:')) {
      return { kind: 'bot_on_behalf', botId, userId: oboPart.slice('on-behalf-of:'.length) || undefined };
    }
    return { kind: 'bot', botId };
  }

  if (raw.startsWith('user:')) {
    return { kind: 'user', userId: raw.slice('user:'.length) || undefined };
  }

  // Legacy fallbacks.
  if (raw === BOT_ID) return { kind: 'bot' };
  return { kind: 'user', userId: raw || undefined };
}

/**
 * Resolve a `performedBy` value to a human-readable name.
 * - bot → "Bot".
 * - bot acting on behalf of a user → "<name> (via bot)".
 * - user → resolved Discord nickname, else a "User #1234" fallback.
 */
export function performerName(
  performedBy: string | number | null | undefined,
  names: DiscordNameMap | undefined,
): string {
  if (performedBy === null || performedBy === undefined || performedBy === '') {
    return 'Unknown';
  }
  const performer = parsePerformedBy(performedBy);
  if (performer.kind === 'bot') return BOT_LABEL;

  const userId = performer.userId;
  if (!userId) return performer.kind === 'bot_on_behalf' ? BOT_LABEL : 'Unknown';

  const resolved = names?.[userId];
  const name = resolved ?? (/^\d+$/.test(userId) ? `User #${userId.slice(-4)}` : userId);
  return performer.kind === 'bot_on_behalf' ? `${name} (via bot)` : name;
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
    type.includes('change') ||
    type.includes('split') ||
    type.includes('move') ||
    type.includes('rename') ||
    type.includes('sync')
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
